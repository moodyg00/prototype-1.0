import 'server-only';

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { spawn, ChildProcess } from 'child_process';
import { AgentEvent, ViewState, Operator, makeEvent } from './types';
import * as fs from 'fs';
import * as path from 'path';
import { getSecureStore, SecureStore } from '../secure-store';

// Core visual browser operator substrate.
import { BrowserActionReasoner } from '../reasoners/BrowserActionReasoner';
import { LoginSpecialist } from '../reasoners/LoginSpecialist';
import { SpecialistContext, loadSkillFiles } from '../reasoners/types';

// Screenshot archive on page change only.
const SCREENSHOTS_DIR = path.join(process.cwd(), 'logs', 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function archiveScreenshot(buffer: Buffer, metadata: any) {
  const ts = Date.now();
  const slug = (metadata.url || 'page').replace(/[^a-z0-9]/gi, '_').substring(0, 50);
  const base = `${ts}-${slug}`;
  const imgPath = path.join(SCREENSHOTS_DIR, `${base}.jpg`);
  const metaPath = path.join(SCREENSHOTS_DIR, `${base}.json`);

  // jpeg quality 45 for size.
  fs.writeFileSync(imgPath, buffer);
  fs.writeFileSync(metaPath, JSON.stringify({
    ...metadata,
    timestamp: ts,
    archivedImage: imgPath,
  }, null, 2));

  return { imgPath, metaPath };
}

function loadSkills(skillDir = 'skills/visual-browser') {
  const dir = path.join(process.cwd(), skillDir);
  if (!fs.existsSync(dir)) return '';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  return files.map(f => {
    const content = fs.readFileSync(path.join(dir, f), 'utf8');
    return `### Skill: ${f.replace('.md','')}\n${content}\n`;
  }).join('\n');
}

export interface BrowserConfig {
  apiKey?: string;  // optional, passed from UI persisted storage as fallback (key primarily from env)
  model?: string;
  viewport?: { width: number; height: number };
  securePassphrase?: string;
  domainCredentials?: Record<string, { username: string; password: string }>;
}

function loadConfig(): { model?: string } {
  try {
    const configPath = path.join(process.cwd(), 'configs', 'browser.config.json');
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf8');
      const cfg = JSON.parse(raw);
      const model = cfg?.model?.id;
      if (model) {
        console.log(`[BrowserOperator] Loaded model config from configs/browser.config.json`);
        return { model };
      }
    }
  } catch (e) {
    console.warn('[BrowserOperator] Could not load config from browser.config.json', e);
  }
  return {};
}

/**
 * Thin, reliable browser driver (the substrate) for a highly customized visual-first agent.
 *
 * The agent = the main reasoner (BrowserActionReasoner + skills + strict json_schema + explicit params).
 *   It owns all the "what should I do next" policy and decides when to ask for vision or call a narrow specialist.
 *
 * This class (the thin script):
 *   - Neutral bootstrap (duckduckgo)
 *   - Cheap structured observation (text + links + interactive elements) + selective screenshots
 *   - Call reasoner for next BrowserActionDecision
 *   - Execute via Playwright (secure credential injection happens ONLY here, never in prompts)
 *   - Archive compressed screenshot + sidecar ONLY on actual page change
 *   - Emit events for live UI + full audit trail
 *   - Basic bounded loop + simple no-progress guard
 *   - Specialists (e.g. login) invoked ONLY when the main reasoner explicitly returns recommend_specialist
 *
 * Visual-first, human-style foundation:
 * The operator is designed so the reasoner first "looks at" the screenshot (visual understanding of the visible page
 * and its interactable parts — buttons, links, form fields, menus, search boxes/filters, extractable data — exactly
 * as a human would) and combines that with cheap DOM/console data before deciding actions.
 *
 * No task-specific hacks, no first-step forcing, no phase machines, no dual paths. (Clean foundation for visual-first browser agent.)
 * The exact prompt the caller (UI) gives to runTask is what the reasoner sees.
 * Arbitrary tasks. The customized agent (reasoner) does the thinking.
 */
export class BrowserOperator implements Operator {
  readonly id = 'browser-operator';
  readonly label = 'Visual Browser Agent (Playwright + xAI vision)';

  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private loginWindowOpen = false;
  private listeners: Array<(e: AgentEvent) => void> = [];
  private events: AgentEvent[] = [];
  private view: ViewState = { kind: 'browser', status: 'idle', title: 'Visual Browser' };
  private running = false;
  private abortController: AbortController | null = null;

  private capturedScreenshots: Array<{ ts: number; dataUrl: string; label: string }> = [];
  private finalAnswer: string | null = null;

  // For change detection (screenshot + vision only on real page changes)
  private lastPageSignature: string | null = null;
  private lastResponseId: string | null = null; // for Responses API state if we switch fully

  // Tactical no-progress / stuck detection (counts consecutive same-page or repeated-action steps).
  // When threshold hit, force extract or early diagnostic 'done' with partial findings + advice.
  // This will later be driven by a dedicated ProgressOrReplanReasoner (low-token specialist).
  private noProgressCount = 0;
  private lastActionKey: string | null = null;

  isReal = true;
  connectInfo: { model: string };

  private config: BrowserConfig;

  // API key is loaded strictly from environment (XAI_API_KEY preferred).
  // Never from config file for security (keys shared across multiple agents/workflows).
  private apiKey?: string;

  // User tweaks override the operator's context-aware "proper" defaults
  private inferenceOverrides: Record<string, any> = {};

  private secureStore: SecureStore;
  private _pendingCredentials: Record<string, { username: string; password: string }> = {};

  // CDP / process management
  private browser: Browser | null = null;
  private ownedProcess: ChildProcess | null = null;
  // Set when the task needs credentials not in SecureStore; the run loop pauses until UI provides them.
  private credentialRequired: { domain: string; reason: 'missing' | 'invalid' } | null = null;
  // Last browser startup error — surfaced to the UI via status API
  private startupError: string | null = null;

  // The thin driver owns: browser lifecycle, cheap obs, change-gated archiving + vision, secure execution, event stream, basic progress guard.
  // The policy lives in the reasoner(s) below.
  private actionReasoner: BrowserActionReasoner | null = null;
  private loginSpecialist: LoginSpecialist | null = null;

  private initReasoners(apiKey: string, model?: string) {
    if (this.actionReasoner) return; // already initialized
    this.actionReasoner = new BrowserActionReasoner({
      apiKey,
      model: model || this.config.model,
      onRawResponse: (raw) => this.emit(makeEvent('observation', `Raw model response: ${raw.substring(0, 480)}${raw.length > 480 ? '...' : ''}`)),
    });

    this.loginSpecialist = new LoginSpecialist({
      apiKey,
      model: model || this.config.model,
      onRawResponse: (raw) => this.emit(makeEvent('observation', `Login specialist: ${raw.substring(0, 200)}`)),
    });
  }

  constructor(config: BrowserConfig) {
    const loaded = loadConfig();
    const loadedModel = config.model || loaded.model || 'grok-4.3';

    // API key priority:
    // 1. Passed from caller (e.g. persisted in UI localStorage for convenience, no visible input)
    // 2. Environment (XAI_API_KEY in .env.local — recommended for all agents/workflows)
    // Never read the secret from the (committed) config file.
    const effectiveApiKey = config.apiKey || process.env.XAI_API_KEY || process.env.OPENAI_API_KEY;

    this.config = {
      viewport: { width: 1280, height: 800 },
      ...config,
      model: loadedModel,
    };
    this.connectInfo = { model: this.config.model! };

    this.apiKey = effectiveApiKey;

    // Initialize secure store. Credentials are NEVER sent to xAI in prompts.
    // They are injected ONLY at Playwright execution time on the server.
    this.secureStore = getSecureStore();

    // Seed direct credentials if provided (for convenience in dev; prefer encrypted store)
    this._pendingCredentials = config.domainCredentials || {};

    // Instantiate the primary low-level prompt agent (BrowserActionReasoner).
    // It owns the focused system + schema + xAI call.
    if (this.apiKey) {
      this.initReasoners(this.apiKey, this.config.model);
    } else {
      console.warn('[BrowserOperator] No xAI API key provided (via caller or XAI_API_KEY env). Operator will not be able to call the model.');
    }
  }

  subscribe(listener: (event: AgentEvent) => void): () => void {
    this.listeners.push(listener);
    // replay history
    this.events.forEach(e => listener(e));
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  getCurrentView(): ViewState {
    return { ...this.view, screenshot: this.view.screenshot };
  }

  getEvents(): AgentEvent[] { return [...this.events]; }

  getCapturedScreenshots() { return [...this.capturedScreenshots]; }
  getFinalAnswer() { return this.finalAnswer; }
  getCredentialRequired() { return this.credentialRequired; }
  clearCredentialRequired() { this.credentialRequired = null; }
  getStartupError() { return this.startupError; }

  private emit(event: AgentEvent) {
    this.events.push(event);
    this.listeners.forEach(l => l(event));
  }

  private updateView(patch: Partial<ViewState>) {
    this.view = { ...this.view, ...patch };
  }

  /**
   * Context-aware skill selection. Keeps the reasoner prompt tight: navigation is always
   * loaded, the secure-login skill is added only when the page looks like an auth surface,
   * and the extraction skill is added only once we are likely on a results page or stuck.
   * This avoids paying for every skill file on a simple navigation step.
   */
  private selectSkills(cheapText: string, step: number, noProgress: number): string {
    const names = ['navigation'];
    const t = (cheapText || '').toLowerCase();
    const loginSignals = /password|sign in|log in|login|sign-in|credential|input\[type="password"\]/.test(t);
    if (loginSignals) names.push('secure-login');
    const resultSignals = /\$\d|price|results|listing|search results|reviews/.test(t);
    if (resultSignals || step >= 3 || noProgress >= 1) names.push('extraction');
    return loadSkillFiles(names);
  }

  async runTask(prompt: string, opts?: { maxSteps?: number }): Promise<void> {
    if (this.running) this.stop();
    if (!prompt.trim()) {
      this.emit(makeEvent('error', 'Empty task.'));
      return;
    }

    this.running = true;
    this.abortController = new AbortController();
    this.finalAnswer = null;
    this.capturedScreenshots = [];
    this.events = [];
    this.view = { kind: 'browser', status: 'thinking', title: 'Browser Operator' };
    this.lastPageSignature = null;
    this.noProgressCount = 0;
    this.lastActionKey = null;

    const skills = loadSkills();
    this.emit(makeEvent('thought', `Starting browser operator for: ${prompt}. Skills: ${skills ? 'yes' : 'no'}.`));

    if (!this.apiKey) {
      this.emit(makeEvent('error', 'No xAI API key configured (XAI_API_KEY env). Browser will boot for observation but model calls will fail.'));
    }

    // Seed any direct credentials passed at construction (now goes to DB via SecureStore)
    if (Object.keys(this._pendingCredentials).length > 0) {
      for (const [domain, cred] of Object.entries(this._pendingCredentials)) {
        await this.secureStore.setCredential(domain, cred);
      }
      this._pendingCredentials = {};
    }

    // If the login browser is still open, close it first (saves the session to the profile).
    if (this.loginWindowOpen) {
      await this.closeLoginBrowser();
    }

    try {
      await this.ensureBrowser();

      // Neutral bootstrap. The customized agent (BrowserActionReasoner + skills + structured outputs)
      // decides every action, including the first goto if the task requires leaving Google.
      // No task-specific or site-specific forcing in the thin driver.
      const initialUrl = 'https://www.google.com';
      this.emit(makeEvent('observation', `Neutral bootstrap at ${initialUrl}. Reasoner decides first action for the exact prompt.`));

      await this.page!.goto(initialUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
      await this.page!.setViewportSize(this.config.viewport!).catch(() => {});
      await this.delay(400);

      const maxSteps = opts?.maxSteps && opts.maxSteps > 0 ? opts.maxSteps : 30;
      let step = 0;

      while (step < maxSteps && this.running && !this.abortController.signal.aborted) {
        // Pause if the UI needs to supply credentials
        if (this.credentialRequired) {
          this.updateView({ status: 'waiting' });
          this.emit(makeEvent('observation', `Waiting for credentials for '${this.credentialRequired.domain}' — enter them in the popup.`));
          let waited = 0;
          while (this.credentialRequired && this.running && !this.abortController.signal.aborted && waited < 120_000) {
            await this.delay(1500);
            waited += 1500;
          }
          if (this.credentialRequired) {
            this.finalAnswer = `Timed out waiting for credentials for '${this.credentialRequired.domain}'. Re-run the task after entering them.`;
            this.emit(makeEvent('result', this.finalAnswer));
            this.updateView({ status: 'idle' });
            break;
          }
          this.emit(makeEvent('observation', 'Credentials received. Resuming task.'));
          this.noProgressCount = 0;
        }

        step++;
        this.updateView({ status: 'thinking' });

        const currentUrl = this.page!.url();
        const currentTitle = await this.page!.title().catch(() => '');
        const cheap = await this.getCheapObservation();
        const sig = `${currentUrl}|${currentTitle}|${cheap.hash}`;

        const changed = sig !== this.lastPageSignature;

        let screenshotDataUrl: string | null = null;
        let buffer: Buffer | null = null;

        if (changed || step === 1) {
          // Screenshot + archive ONLY on real page change (user requirement: compress, archive for post-hoc, send to model only when necessary).
          ({ dataUrl: screenshotDataUrl, buffer } = await this.takeCompressedScreenshot());
          this.updateView({ screenshot: screenshotDataUrl, status: 'observing', title: `${currentTitle} — ${currentUrl}` });

          const label = `Step ${step}: ${currentTitle}`;
          this.capturedScreenshots.push({ ts: Date.now(), dataUrl: screenshotDataUrl, label });
          this.emit(makeEvent('screenshot', label, { screenshot: screenshotDataUrl }));

          archiveScreenshot(buffer!, {
            url: currentUrl,
            title: currentTitle,
            step,
            task: prompt,
            observation: cheap.text.substring(0, 700),
          });

          this.lastPageSignature = sig;
          this.noProgressCount = 0;
        } else {
          this.noProgressCount++;
          this.emit(makeEvent('observation', `No page change (no-progress: ${this.noProgressCount}).`));
        }

        // Recovery vision: when stuck (noProgress rising) on the same page, force a fresh low-quality screenshot
        // so the vision model can actually "look at" the current results, prices, filter UI, etc.
        // This is how we exercise the real purpose of the agent over pure URL/text tricks.
        const forceRecoveryVision = this.noProgressCount >= 2;
        if (forceRecoveryVision && !screenshotDataUrl) {
          ({ dataUrl: screenshotDataUrl } = await this.takeCompressedScreenshot());
          this.updateView({ screenshot: screenshotDataUrl });
        }

        // Call the main reasoner (the highly customized agent). Selective vision: on real change, or for recovery when stuck.
        const includeVision = !!screenshotDataUrl;
        const ctx: SpecialistContext = {
          task: prompt,
          cheapObservation: cheap.text,
          screenshotDataUrl: includeVision ? screenshotDataUrl : null,
          step,
          domain: this.extractDomainFromTask(prompt) || undefined,
          skills: this.selectSkills(cheap.text, step, this.noProgressCount),
          inferenceOverrides: this.inferenceOverrides,
          noProgressCount: this.noProgressCount,
        };

        let decision: any;
        try {
          decision = this.actionReasoner
            ? await this.actionReasoner.decide(ctx, this.inferenceOverrides)
            : { thought: 'No reasoner', action: 'done' };
        } catch (e: any) {
          this.emit(makeEvent('error', `Reasoner error: ${e.message || e}`));
          decision = { thought: 'Reasoner failed, extracting state.', action: 'extract' };
        }

        // Always emit what the operator/reasoner chose for this call (transparency).
        const shownParams = {
          reasoning_effort: step < 3 ? 'low' : (includeVision ? 'medium' : 'low'),
          temperature: 0.2,
          top_p: 0.9,
          max_output_tokens: step < 3 ? 350 : 550,
          ...this.inferenceOverrides,
        };
        this.emit(makeEvent('observation', `Operator chose params: ${JSON.stringify(shownParams)}`));

        this.emit(makeEvent('thought', decision.thought || ''));

        let effective = decision;

        // Specialists only when the main reasoner explicitly recommends them via the schema (recommend_specialist field).
        // If the reasoner recommended a specialist, *always* honor it by consulting the specialist and using
        // its nextAction/target/hints as the effective action for *this step*. This takes precedence over
        // the main reasoner's action (including when it paired "done" + a plan description in thought with the recommend).
        // This ensures "recommend login" actually causes a type-with-marker (or click) to be executed now,
        // instead of the step terminating with a meta announcement as the final answer.
        if (decision.recommend_specialist === 'login' && this.loginSpecialist) {
          try {
            const spec = await this.loginSpecialist.decide(ctx as any, this.inferenceOverrides);
            if (spec) {
              this.emit(makeEvent('observation', `LoginSpecialist: ${spec.thought || ''}`));
              effective = {
                thought: spec.thought || decision.thought,
                action: spec.nextAction || 'type',
                text: spec.target || decision.text,
                selector: spec.usernameFieldHint || spec.passwordFieldHint || decision.selector,
              };
              // Ensure a stray final_answer from the main decision doesn't leak if the specialist
              // provided a non-done action for the current step.
              if (effective.action !== 'done') delete (effective as any).final_answer;
            }
          } catch {}
        }

        // Simple repeated-action no-progress tracking (thin driver, not heavy strategy).
        const actionKey = `${effective.action}|${effective.url || ''}|${(effective.selector || effective.text || '').slice(0, 50)}`;
        if (this.lastActionKey === actionKey) this.noProgressCount++;
        this.lastActionKey = actionKey;

        if (this.noProgressCount >= 5 && step > 4) {
          // Force a broad extract on no-progress so the final answer at least contains
          // whatever is visible (prices/titles/links) instead of a useless message.
          try {
            const listings = await this.page!.evaluate(() => {
              const out: string[] = [];
              document.querySelectorAll('li.cl-search-result, .cl-search-result, .result-row, .search-result, [data-pid], .result, .listing').forEach((c, i) => {
                if (i > 8) return;
                const price = (c.querySelector('.price, .result-price, [class*="price"]') as any)?.innerText?.trim() || '';
                const title = (c.querySelector('a, .title, h3, h4') as any)?.innerText?.trim().replace(/\s+/g,' ').slice(0,60) || '';
                const href = (c.querySelector('a[href]') as HTMLAnchorElement)?.href || '';
                if (price || title) out.push(`${price || 'N/A'} — ${title} ${href}`.trim());
              });
              return out.join(' || ') || 'no listing elements found';
            }).catch(() => 'extract failed');
            const extractText = `Current page extract (no-progress recovery):\nURL: ${currentUrl}\nListings: ${listings}`;
            this.emit(makeEvent('observation', extractText));

            let summary = `No progress after ${step} steps at ${currentUrl}. Partial data from page:\n${extractText}\nFull screenshots + trace archived in logs/screenshots/.`;

            // If we saw a secure-credential failure, make the final message actionable for the user.
            const recentEvents = this.events || [];
            if (recentEvents.some((e: any) => (e.content || '').toLowerCase().includes('no credentials in store'))) {
              summary += `\n\nThe secure store reported no credentials for this domain. Open the Secure Logins section in the Visual Browser UI, enter Domain + Username + Password for the exact domain shown in the 'Secure marker ... could not be resolved' observations above (e.g. accounts.google.com or google.com), click "Save for domain", then re-run the task.`;
            }

            this.finalAnswer = summary;
            this.emit(makeEvent('result', summary));
          } catch {
            const summary = `No progress after ${step} steps at ${currentUrl}. Screenshots + full trace archived.`;
            this.finalAnswer = summary;
            this.emit(makeEvent('result', summary));
          }
          this.updateView({ status: 'idle' });
          break;
        }

        if (effective.action === 'done') {
          // Termination is driven by the explicit action field (per schema: final_answer is ONLY
          // meaningful when action=done). A stray final_answer on a type/click/goto/etc. is ignored
          // for termination so the declared action can still execute (and any recommended specialist
          // can still be consulted for that step). This prevents the model from accidentally
          // short-circuiting a login sequence by putting the secure marker (or a plan) into final_answer.
          let ans = effective.final_answer || effective.thought || 'Task complete.';
          // Still protect against the model using a plan description (instead of observed outcome)
          // even when it sets action=done.
          const isMetaPlan = !effective.final_answer &&
            /(use|recommend).*specialist|login form visible|task is to login|on .*login page.*fields visible|perform secure login for the current domain/i.test(ans);
          if (isMetaPlan) {
            this.emit(makeEvent('observation', 'Reasoner attempted to finish with plan announcement instead of executable action or verified result; continuing.'));
            effective = { thought: 'Forcing continuation after meta plan in done; will execute next concrete step or specialist effect.', action: 'extract' };
          } else {
            this.finalAnswer = ans;
            this.emit(makeEvent('result', `Final answer: ${this.finalAnswer}`));
            this.updateView({ status: 'idle' });
            break;
          }
        }

        await this.executeAction(effective);

        this.emit(makeEvent('action', this.describeAction(effective), {
          tool: 'browser',
          coords: (effective.x != null && effective.y != null) ? [effective.x, effective.y] : undefined,
        }));

        await this.delay(350);
      }

      if (!this.finalAnswer) {
        this.finalAnswer = 'Max steps reached. Trace + screenshots in logs/screenshots/.';
        this.emit(makeEvent('result', this.finalAnswer));
      }
    } catch (err: any) {
      console.error('BrowserOperator error', err);
      this.emit(makeEvent('error', `Operator error: ${err?.message || err}`));
    } finally {
      this.running = false;
      this.updateView({ status: 'idle' });
      this.abortController = null;
    }
  }

  private async getCheapObservation() {
    if (!this.page) return { text: '', hash: '' };
    try {
      const [text, links, interactive, listingsText] = await Promise.all([
        this.page.evaluate(() => document.body.innerText.slice(0, 1400)),
        this.page.evaluate(() => Array.from(document.querySelectorAll('a')).map(a => (a.innerText.trim() + ' ' + a.href).trim()).filter(Boolean).slice(0, 10).join(' | ')),
        this.page.evaluate(() => {
          const els = Array.from(document.querySelectorAll('input, button, [role="button"], select, textarea'));
          return els.map(el => {
            const tag = el.tagName.toLowerCase();
            const type = (el as HTMLInputElement).type || '';
            const nm = (el as any).name || '';
            const id = (el as any).id || '';
            const ph = (el as any).placeholder || '';
            const val = (el as HTMLInputElement).value || '';
            const filled = val.length > 0 ? ' [filled]' : '';
            // Build a reliable CSS selector string the reasoner can use directly
            let css = tag;
            if (type) css += `[type="${type}"]`;
            if (nm) css += `[name="${nm}"]`;
            else if (id) css += `#${id}`;
            else if (ph) css += `[placeholder*="${ph.substring(0, 20)}"]`;
            const label = nm || id || ph || (el as HTMLElement).innerText?.slice(0, 25) || '';
            return `${css} ${label}${filled}`.trim();
          }).filter(Boolean).slice(0, 12).join(' ; ');
        }),
        // Simple inline pull for listing-like content (prices + titles + links) on results pages.
        // No dedicated helper method — just enough so the reasoner can see actual items.
        this.page.evaluate(() => {
          const out: string[] = [];
          const containers = Array.from(document.querySelectorAll('li.cl-search-result, .cl-search-result, .result-row, .search-result, [data-pid], .result, .listing'));
          containers.slice(0, 6).forEach(c => {
            const price = (c.querySelector('.price, .result-price, [class*="price"]') as HTMLElement)?.innerText.trim() || '';
            const title = (c.querySelector('a, .title, h3, h4') as HTMLElement)?.innerText.trim().replace(/\s+/g, ' ').slice(0,60) || '';
            const href = (c.querySelector('a[href]') as HTMLAnchorElement)?.href || '';
            if (price || title) out.push(`${price || 'N/A'} ${title} ${href}`.trim());
          });
          if (out.length === 0) {
            // fallback: any $ prices near links
            Array.from(document.querySelectorAll('a')).some(a => {
              const t = a.textContent || '';
              const m = t.match(/\$[\d,]+/);
              if (m && out.length < 6) { out.push(`${m[0]} ${t.slice(0,50)} ${a.href}`); return false; }
              return false;
            });
          }
          return out.join(' || ');
        }).catch(() => '')
      ]);
      const url = this.page.url();
      const title = await this.page.title().catch(() => '');
      const listingsSummary = listingsText ? `\nListings: ${listingsText}` : '';
      const full = `URL: ${url}\nTitle: ${title}\nText: ${text}\nLinks: ${links}\nInteractive: ${interactive}${listingsSummary}`;
      const hash = Buffer.from(full).toString('base64').slice(0, 32);
      return { text: full, hash };
    } catch {
      return { text: 'Could not extract page content', hash: Date.now().toString() };
    }
  }

  private extractDomainFromTask(task: string): string | null {
    // Simple extraction for common patterns like "login to example.com" or "go to app.example.com"
    const match = task.match(/([a-z0-9-]+\.[a-z]{2,})/i);
    return match ? match[1].toLowerCase() : null;
  }

  stop(): void {
    if (this.abortController) this.abortController.abort();
    this.running = false;
    this.updateView({ status: 'idle' });
    this.emit(makeEvent('error', 'Agent stopped by user.'));
    this.abortController = null;
  }

  async invoke(action: string, payload?: any): Promise<any> {
    // Allow manual control from UI if desired
    if (!this.page) return { ok: false };
    if (action === 'goto' && payload?.url) {
      await this.page.goto(payload.url);
      await this.captureAndEmit(`Manual goto ${payload.url}`);
    }
    return { ok: true };
  }

  // Allow external (UI/API) tweaks to override operator-chosen params
  // Operator still decides the base "proper" values based on context (step, vision needed, etc.)
  setInferenceOverrides(overrides: Record<string, any>) {
    this.inferenceOverrides = { ...this.inferenceOverrides, ...overrides };
  }

  /** Force-close the current browser context so the next runTask() reconnects fresh (e.g. to a newly-launched real Chrome on CDP). */
  async resetBrowser(): Promise<void> {
    this.stop();
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
    if (this.ownedProcess) {
      try { this.ownedProcess.kill(); } catch {}
      this.ownedProcess = null;
    }
    this.startupError = null;
    this.loginWindowOpen = false;
    this.emit(makeEvent('observation', 'Browser context reset — will reconnect on next run.'));
  }

  private get profileDir() {
    return path.join(process.cwd(), 'logs', 'chrome-profile');
  }

  private async connectOverCdp(port: number, timeout: number): Promise<Browser> {
    const urls = [`http://127.0.0.1:${port}`, `http://localhost:${port}`];
    let lastError: any;
    for (const url of urls) {
      try {
        return await chromium.connectOverCDP(url, { timeout });
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError;
  }

  /** Resolve the user's real Chrome/Chromium user-data directory (not the agent profile). */
  private get realChromeProfileDir(): string | null {
    // Explicit override wins
    const envPath = process.env.CHROME_USER_DATA_DIR;
    if (envPath && fs.existsSync(envPath)) return envPath;
    // Auto-detect macOS paths
    const home = process.env.HOME || '';
    for (const p of [
      `${home}/Library/Application Support/Google/Chrome`,
      `${home}/Library/Application Support/Chromium`,
    ]) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  }

  /** True if Chrome has the profile directory locked (i.e. Chrome is currently running with it). */
  private isChromeProfileLocked(profileDir: string): boolean {
    return fs.existsSync(path.join(profileDir, 'SingletonLock'));
  }

  private async ensureBrowser() {
    if (this.context && this.page && !this.page.isClosed()) return;
    // Stale context — tear down before relaunching.
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }

    const CDP_PORT = 9222;
    const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    const agentProfileDir = this.profileDir;
    fs.mkdirSync(agentProfileDir, { recursive: true });
    this.startupError = null;

    // ── Path 1: CDP ─────────────────────────────────────────────────────────
    // Attach to an already-running Chrome that has --remote-debugging-port=9222
    // on a non-default profile dir (Chrome security blocks CDP on its default dir).
    try {
      this.browser = await this.connectOverCdp(CDP_PORT, 2000);
      const ctxs = this.browser.contexts();
      this.context = ctxs.length > 0 ? ctxs[0] : await this.browser.newContext();
      this.emit(makeEvent('observation', 'CDP: attached to your running Chrome — using your existing logged-in sessions.'));
    } catch {
      this.browser = null;
    }

    // ── Path 2: Agent profile with real Chrome binary ────────────────────────
    // Launch headless Chrome with the agent-owned profile dir.
    // Sessions logged in via the Login tab will persist here.
    if (!this.context && fs.existsSync(chromePath)) {
      try {
        const proc = spawn(chromePath, [
          `--user-data-dir=${agentProfileDir}`,
          `--remote-debugging-port=${CDP_PORT}`,
          '--headless=new',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-default-apps',
          '--no-sandbox',
        ], { detached: true, stdio: 'ignore' });
        proc.unref();
        this.ownedProcess = proc;
        await this.delay(2500);

        this.browser = await this.connectOverCdp(CDP_PORT, 6000);
        const ctxs = this.browser.contexts();
        this.context = ctxs.length > 0 ? ctxs[0] : await this.browser.newContext();
        this.startupError = 'Using agent browser profile. Use the Login tab to sign in — sessions persist across runs.';
        this.emit(makeEvent('observation', 'Chrome launched with agent profile. Use Login tab to authenticate once; sessions persist.'));
      } catch (e: any) {
        this.browser = null;
        this.ownedProcess = null;
        this.emit(makeEvent('error', `Agent profile Chrome launch failed: ${e?.message || e}`));
      }
    }

    // ── Path 3: Playwright bundled Chromium (ultimate fallback) ──────────────
    if (!this.context) {
      try {
        this.context = await chromium.launchPersistentContext(agentProfileDir, {
          headless: true,
          viewport: this.config.viewport,
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        if (!this.startupError) {
          this.startupError = 'Using Playwright Chromium fallback. Use the Login tab to authenticate once.';
        }
        this.emit(makeEvent('observation', 'Playwright bundled Chromium (fallback). Use Login tab to authenticate.'));
      } catch (e: any) {
        const msg = `All browser launch methods failed: ${e?.message || e}`;
        this.startupError = msg;
        this.emit(makeEvent('error', msg));
        throw new Error(msg);
      }
    }

    const pages = this.context!.pages();
    this.page = pages.length > 0 ? pages[0] : await this.context!.newPage();
    await this.page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
  }

  /** Open a headed Chrome window at the given URL so the user can log in.
   *  Uses real Chrome with the agent profile — supports Google sign-in and saves sessions. */
  async openLoginBrowser(url: string): Promise<void> {
    if (this.running) this.stop();
    // Release any headless context/process first to free the profile lock
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
    if (this.ownedProcess) {
      try { this.ownedProcess.kill(); } catch {}
      this.ownedProcess = null;
    }

    const profileDir = this.profileDir;
    fs.mkdirSync(profileDir, { recursive: true });
    const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

    if (fs.existsSync(chromePath)) {
      // Open real Chrome in headed mode — sign in with Google or site credentials
      const proc = spawn(chromePath, [
        `--user-data-dir=${profileDir}`,
        '--no-first-run',
        '--no-default-browser-check',
        url,
      ], { detached: true, stdio: 'ignore' });
      proc.unref();
      this.loginWindowOpen = true;
      this.emit(makeEvent('observation', `Login browser opened at ${url}. Prefer "Sign in with Google" when available, then click Done.`));
    } else {
      // Fallback: Playwright-managed headed browser
      this.context = await chromium.launchPersistentContext(profileDir, {
        headless: false,
        viewport: this.config.viewport,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      this.page = await this.context.newPage();
      await this.page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => {});
      this.loginWindowOpen = true;
      this.emit(makeEvent('observation', `Login browser opened at ${url} — log in, then click Done.`));
    }
  }

  async closeLoginBrowser(): Promise<void> {
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
    if (this.ownedProcess) {
      try { this.ownedProcess.kill(); } catch {}
      this.ownedProcess = null;
    }
    this.loginWindowOpen = false;
    this.emit(makeEvent('observation', 'Login browser closed — session saved to profile.'));
  }

  getLoginWindowOpen(): boolean { return this.loginWindowOpen; }

  private async takeScreenshot(): Promise<{ dataUrl: string; buffer: Buffer }> {
    if (!this.page) throw new Error('No page');
    // For live UI view we can keep higher quality if wanted, but for efficiency use jpeg
    const buffer = await this.page.screenshot({ type: 'jpeg', quality: 65, fullPage: false });
    const base64 = buffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    this.updateView({ screenshot: dataUrl });
    return { dataUrl, buffer };
  }

  private async takeCompressedScreenshot(): Promise<{ dataUrl: string; buffer: Buffer }> {
    if (!this.page) throw new Error('No page');
    // Significantly compressed for archive + lower token cost if sent
    const buffer = await this.page.screenshot({ 
      type: 'jpeg', 
      quality: 45,           // heavy compression
      fullPage: false,
      // Could add clip or scale for further size reduction in future
    });
    const base64 = buffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    return { dataUrl, buffer };
  }

  private async captureAndEmit(label: string) {
    const { dataUrl } = await this.takeScreenshot();
    this.capturedScreenshots.push({ ts: Date.now(), dataUrl, label });
    this.emit(makeEvent('screenshot', label, { screenshot: dataUrl }));
  }

  private async getPageTitle(): Promise<string> {
    if (!this.page) return 'Browser';
    try {
      const title = await this.page.title();
      const url = this.page.url();
      return `${title} — ${new URL(url).hostname}`;
    } catch { return 'Browser'; }
  }

  /**
   * Legacy thin wrapper (rarely used). Main loop calls actionReasoner.decide directly.
   * Kept only as a minimal fallback.
   */
  private async askModelForAction(
    task: string, 
    screenshotDataUrl: string | null, 
    step: number, 
    cheapObservation: string,
    skills: string
  ): Promise<any> {
    if (this.actionReasoner) {
      const ctx: SpecialistContext = {
        task,
        cheapObservation,
        screenshotDataUrl,
        step,
        domain: this.extractDomainFromTask(task) || undefined,
        skills,
        inferenceOverrides: this.inferenceOverrides,
      };
      return this.actionReasoner.decide(ctx, this.inferenceOverrides);
    }
    return { thought: 'No reasoner available.', action: 'done' };
  }

  private async executeAction(decision: any) {
    if (!this.page) return;
    const vp = this.config.viewport!;

    switch (decision.action) {
      case 'goto':
        if (decision.url) {
          await this.page.goto(decision.url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
          await this.page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {});
          await this.delay(500);
        }
        break;

      case 'click':
        // Click: prefer reliable selector, fall back to text/coords/keyboard if needed.
        // Always followed by verification in the main loop.
        let clickSuccess = false;
        if (decision.selector) {
          await this.page!.click(decision.selector, { timeout: 8000 }).then(() => { clickSuccess = true; }).catch(async () => {});
        }
        if (!clickSuccess && decision.text) {
          // Try clicking by visible text (common on real sites)
          const textSel = `text=${decision.text}`;
          await this.page!.click(textSel, { timeout: 6000 }).then(() => { clickSuccess = true; }).catch(async () => {});
        }
        if (!clickSuccess && typeof decision.x === 'number' && typeof decision.y === 'number') {
          const x = Math.max(10, Math.min(vp.width - 10, Math.round(decision.x * vp.width)));
          const y = Math.max(10, Math.min(vp.height - 10, Math.round(decision.y * vp.height)));
          await this.page.mouse.click(x, y);
          clickSuccess = true;
          this.updateView({ highlight: { x: decision.x, y: decision.y } });
          await this.delay(300);
          this.updateView({ highlight: undefined });
        }
        if (!clickSuccess) {
          // Last resort: tab to and enter (for accessibility)
          await this.page.keyboard.press('Tab');
          await this.page.keyboard.press('Enter');
        }
        await this.delay(400);
        await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
        break;

      case 'type':
        if (decision.text) {
          let valueToType = decision.text;

          // Secure credential injection (server-side only):
          // The model (or specialist) outputs high-level markers like "use stored credentials for the current domain"
          // or "perform secure login...". Real values are looked up here from SecureStore and injected
          // into Playwright — the marker text and real secrets never go to the model or xAI.
          const lowerText = valueToType.toLowerCase();
          const isSecureMarker = lowerText.includes('stored credential') ||
                                 lowerText.includes('secure login') ||
                                 lowerText.includes('password') ||
                                 lowerText.includes('username') ||
                                 lowerText.includes('email');

          if (isSecureMarker) {
            const url = this.page!.url();
            const domain = url.replace(/^https?:\/\//, '').split('/')[0];
            const cred = await this.secureStore.getCredential(domain);
            if (cred) {
              // Decide username vs password using selector hint (more reliable than only keywords in the marker text)
              // or fallback to keywords in the marker.
              const sel = (decision.selector || '').toLowerCase();
              const isUsernameField = sel.includes('email') || sel.includes('user') || sel.includes('login') ||
                                      lowerText.includes('username') || lowerText.includes('email') || lowerText.includes('user');
              valueToType = isUsernameField ? cred.username : cred.password;
            } else {
              // No creds: emit clear failure observation. The reasoner must see this and adapt (e.g. conclude the task cannot complete without creds).
              let displayDomain = domain.toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
              if (displayDomain.startsWith('www.')) displayDomain = displayDomain.slice(4);
              const authPrefixes = ['accounts.', 'login.', 'auth.', 'secure.', 'my.', 'signin.', 'account.'];
              for (const p of authPrefixes) {
                if (displayDomain.startsWith(p)) { displayDomain = displayDomain.slice(p.length); break; }
              }
              this.credentialRequired = { domain: displayDomain, reason: 'missing' };
              this.emit(makeEvent('observation', `No credentials found for '${displayDomain}' — enter them in the popup to continue.`));
              valueToType = '';
            }
          }

          if (valueToType) {  // only type if we have something real (or non-marker)
            if (decision.selector) {
              await this.page!.fill(decision.selector, valueToType, { timeout: 8000 }).catch(async () => {
                if (this.page) await this.page.keyboard.type(valueToType, { delay: 30 });
              });
            } else {
              await this.page.keyboard.type(valueToType, { delay: 30 });
            }
          }
          await this.delay(400);
          await this.page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
        }
        break;

      case 'scroll':
        await this.page.mouse.wheel(0, 700);
        await this.delay(400);
        break;

      case 'extract':
        // When the reasoner asks to extract, pull visible listings/prices/titles/links directly.
        // Inline (no dedicated helper) so the reasoner can turn the current page into a final_answer.
        if (decision.selector) {
          const extracted = await this.page.locator(decision.selector).innerText().catch(() => '');
          this.emit(makeEvent('observation', `Extracted via selector: ${extracted.substring(0,500)}`));
        } else {
          const listings = await this.page.evaluate(() => {
            const out: string[] = [];
            document.querySelectorAll('li.cl-search-result, .cl-search-result, .result-row, .search-result, [data-pid], .result, .listing').forEach((c, i) => {
              if (i > 10) return;
              const price = (c.querySelector('.price, .result-price, [class*="price"]') as any)?.innerText?.trim() || '';
              const title = (c.querySelector('a, .title, h3, h4') as any)?.innerText?.trim().replace(/\s+/g,' ').slice(0,60) || '';
              const href = (c.querySelector('a[href]') as HTMLAnchorElement)?.href || '';
              if (price || title) out.push(`${price || 'N/A'} — ${title} ${href}`.trim());
            });
            return out.join(' || ') || Array.from(document.querySelectorAll('a')).map(a => a.href).filter(Boolean).slice(0,8).join(' | ');
          }).catch(() => 'broad extract failed');
          this.emit(makeEvent('observation', `Extract: ${listings.substring(0, 900)}`));
        }
        break;

      case 'search_web':
        // Fallback navigation for discovery when model emits search_web instead of direct goto.
        // Build a Google search URL from the provided text or task context.
        {
          const q = (decision.text || decision.url || 'tinder official site').toString();
          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
          await this.page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
          await this.page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {});
          this.emit(makeEvent('observation', `Executed search_web as direct Google navigation: ${searchUrl}`));
        }
        break;

      case 'wait':
        await this.delay(800);
        break;

      case 'done':
        break;
    }

    await this.delay(400);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});

    // Persist authenticated session (cookies etc.) for this domain so future tasks don't need re-login.
    // This file contains NO raw passwords.
    try {
      const url = this.page!.url();
      const domain = url.replace(/^https?:\/\//, '').split('/')[0];
      if (domain) {
        const state = await this.page!.context().storageState();
        this.secureStore.saveSession(domain, state);
      }
    } catch {}
  }

  private describeAction(d: any): string {
    if (d.action === 'click' && d.x != null) return `Click at (${(d.x*100).toFixed(0)}%, ${(d.y*100).toFixed(0)}%)`;
    if (d.action === 'goto') return `Navigate to ${d.url}`;
    if (d.action === 'type') return `Type: "${d.text}"`;
    if (d.action === 'scroll') return 'Scroll down';
    if (d.action === 'done') return 'Task complete';
    return d.action || 'Action';
  }

  private async delay(ms: number) {
    return new Promise(r => setTimeout(r, ms));
  }

  async close() {
    this.stop();
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
    if (this.ownedProcess) {
      try { this.ownedProcess.kill(); } catch {}
      this.ownedProcess = null;
    }
  }
}

// Simple singleton for the app (one active real browser agent at a time)
let _instance: BrowserOperator | null = null;

export function getBrowserOperator(config?: BrowserConfig): BrowserOperator {
  if (!_instance) {
    _instance = new BrowserOperator(config || {});
  } else if (config) {
    if (config.model) (_instance as any).config.model = config.model;
    if (config.apiKey) {
      (_instance as any).apiKey = config.apiKey;
      (_instance as any).config.apiKey = config.apiKey; // for any legacy checks
    }
    const keyToUse = config.apiKey || (_instance as any).apiKey || process.env.XAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!( _instance as any ).actionReasoner && keyToUse) {
      (_instance as any).initReasoners(keyToUse, (_instance as any).config.model);
    }
  }
  return _instance;
}
