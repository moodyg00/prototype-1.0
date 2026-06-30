/**
 * BrowserActionReasoner
 *
 * The first concrete "prompt agent" / low-token specialist reasoner.
 * The core prompt agent for deciding browser actions using screenshot + cheap DOM data.
 *
 * Responsibilities (narrow):
 * - Given cheap obs (+ optional fresh screenshot), current step, task, and skills,
 *   decide the SINGLE next low-level browser action using a focused system prompt
 *   + strict json_schema.
 * - Choose sensible operator default inference params (low/medium reasoning_effort etc.)
 *   and let caller/UI overrides win.
 * - Never contain creds, never do execution, never manage loops or sessions.
 *
 * This makes the policy (the "what should I do next on this page for this goal")
 * easy to version, A/B test, specialize, or replace with an even smaller specialist.
 */

import { SpecialistContext, BrowserActionDecision, InferenceParams, PromptReasoner, mergeInferenceParams, loadSkills } from './types';
import { callXaiStructured } from './xaiClient';

export class BrowserActionReasoner implements PromptReasoner<SpecialistContext, BrowserActionDecision> {
  readonly name = 'BrowserActionReasoner';
  readonly description = 'Decides the next atomic GUI action (goto/click/type/...) for a browser operator task using a tight low-token prompt + strict structured output.';

  private apiKey: string;
  private model: string;       // vision-capable model, used only when a screenshot is attached
  private textModel: string;   // cheap text model, used for DOM-only (no screenshot) steps
  private onRaw?: (raw: string) => void;

  constructor(opts: { apiKey: string; model?: string; textModel?: string; onRawResponse?: (raw: string) => void }) {
    this.apiKey = opts.apiKey;
    this.model = opts.model || 'grok-4.3';
    this.textModel = opts.textModel || 'grok-3-mini';
    this.onRaw = opts.onRawResponse;
  }

  async decide(input: SpecialistContext, overrides: Record<string, any> = {}): Promise<BrowserActionDecision> {
    const { task, cheapObservation, screenshotDataUrl, step, skills: providedSkills, noProgressCount = 0 } = input;

    // Load browser skills if not already provided (reasoners can be called standalone too)
    const skills = providedSkills || loadSkills('skills/visual-browser');

    const actionSchema = {
      type: "object",
      properties: {
        thought: {
          type: "string",
          description: "Concise reasoning: what I see/need, why this action, how it progresses the exact user task. If noProgressCount is high, explain why you are changing approach instead of repeating."
        },
        action: {
          type: "string",
          enum: ["goto", "click", "type", "scroll", "extract", "search_web", "done"],
          description: "The single next action. Prefer direct constructed 'goto' URLs for discovery. Once on a search/results page, strongly prefer 'extract' to surface titles, prices, links, counts rather than re-navigating."
        },
        recommend_specialist: {
          type: "string",
          enum: ["login", "replan", "extract", "captcha"],
          description: "Optional: suggest a narrow specialist on stuck or for auth/structured data. 'replan' or 'extract' when repeating actions."
        },
        url: { type: "string", description: "For goto or search_web" },
        selector: { type: "string", description: "CSS/text/role selector for click/type (preferred over coords)" },
        x: { type: "number", description: "Normalized 0-1 for click if no good selector" },
        y: { type: "number" },
        text: { type: "string", description: "Text to type or search query or high-level secure instruction e.g. 'use stored credentials for the current domain'" },
        final_answer: {
          type: "string",
          description: "STRICTLY ONLY when action exactly equals 'done' after the full task (including login) has been verified complete via observation. Never emit this field for any other action (type, click, goto, etc.). If you emit final_answer on a type/click action the previous step's value may pollute logs even if the driver ignores it for termination."
        }
      },
      required: ["thought", "action"],
      additionalProperties: false
    };

    const system = `You are a highly capable, efficient browser agent.
${skills ? 'Loaded Skills:\n' + skills : ''}

Core rules:
- You are given the exact current user task. Stay strictly on it. Do not drift to other goals.
- The purpose of this real browser + vision agent is to succeed on tasks where simple URL query tricks and text scraping fail. Direct 'goto' with params (e.g. &maxPrice=300) is allowed for efficiency as a first attempt only. If after landing the observation (text or screenshot) shows the filter didn't fully apply or you need to inspect actual items, use the visible on-page GUI controls instead of more URL params.
- After navigation or action, verify the effect using the current observation + screenshot (when provided). Use the image to visually read prices, titles, and UI elements on results pages.
- On a search/results page: once you have listings visible (via extract or the observation text/image showing prices under the target), stop extracting or navigating. Output action "done" with a final_answer that clearly lists the relevant items (price, title/description, link, location if available) that match the user's criteria. Synthesize a useful answer from what you see.
- Prefer reliable selectors. If you need more structured data, use 'extract', but only as a step toward completing the task.
- **Secure / login flows with stored credentials (critical):** You output high-level markers such as "use stored credentials for the current domain" or "perform secure login for the current domain using stored credentials". The execution layer will try to inject real values from the secure store (DB) and will always report the result in an observation.
  - If you see ANY observation containing "no credentials in store" or "Secure marker ... could not be resolved - no credentials in store", this is TERMINAL: there are no saved credentials for the domain that appeared in the obs (e.g. accounts.google.com).
  - You MUST IMMEDIATELY stop the login sequence. The very next JSON you output (this turn) MUST be action:"done" with a final_answer. Do not output type, click, or recommend anything else. Do not wait for more steps or noProgress.
  - The final_answer must be the exact helpful message: "I reached the [site] login form but the secure store has no credentials saved for [exact-domain-from-obs]. Please open the Secure Logins section, fill Domain + Username + Password for '[exact-domain]', click 'Save for domain', then re-run this exact task."
  - Example final_answer for this case: "I reached the Google login form but the secure store has no credentials saved for accounts.google.com. Please open the Secure Logins section, fill Domain + Username + Password for 'accounts.google.com', click 'Save for domain', then re-run this exact task."
- **Loop prevention (critical):** The noProgressCount tells you how many consecutive steps had no observable page change. If >= 2, do not repeat the previous action. Switch to 'extract' to gather, then immediately to "done" with final_answer once the data (or auth limitation) is clear from the observation. Repeating is a mistake.
- Output ONLY the minified JSON action. Nothing else outside the object.
- Never put your plan, summary, or "I will use the specialist" into final_answer or thought as a way to finish. final_answer (or using thought as the answer) is ONLY for when the user's original task is actually complete (e.g. successfully logged in and verified by observation that the login form is gone, home/feed/profile is visible, or you have extracted the requested data).
- **CRITICAL — Login forms (strict sequence using improved obs):** The interactive obs now gives reliable CSS selectors (e.g. "input[type=\"text\"][name=\"email\"] Email or mobile number [filled] ; input[type=\"password\"][name=\"pass\"] Password").
  Use the "input[type=...][name=...]" part as your "selector" value — it is a direct, working locator.
  - On first login form (email field visible, no [filled]): type the marker on the email CSS selector + **the JSON object MUST contain the property "recommend_specialist": "login"**.
  - Next turn (email shows [filled] in obs): type the marker on the password CSS selector (use [filled] to advance; never repeat email type).
  - After both fields [filled]: click the submit button (text "Log in", or the button from obs; include recommend_specialist if helpful).
  - Verify: login form gone + logged-in homepage content visible in obs/screenshot. Only then action "done" + final_answer.
- The output JSON **must** include the exact key "recommend_specialist": "login" (as a top-level string property) when on a login form for the specialist to provide hints. Putting the words only in "thought" does nothing.
- Never include "final_answer" unless action exactly "done" after verification.
- Use the [filled] markers and the CSS selector strings from obs. Do not copy old "input:text email" style if better CSS is present.

SECURE LOGIN (CRITICAL):
- Never output real credentials. Use high-level instructions like "perform secure login for the current domain using stored credentials".
- The thin execution layer will inject real values only at Playwright time.

Current task: ${task}
Step: ${step}
noProgressCount: ${noProgressCount}

Decide the single next action that best advances the exact task without looping.`;

    const userContent: any[] = [
      {
        type: "text",
        text: `Cheap observation (text/DOM/URL):\n${cheapObservation}\n\nnoProgressCount: ${noProgressCount}\n\nIf the obs contains "no credentials in store" or "Secure marker ... could not be resolved", output action:"done" + final_answer with the exact save instructions using the domain from the obs. Do not type again. Otherwise for login: copy CSS selector from obs, follow sequence with recommend_specialist key in JSON, use [filled] to advance, no final_answer until done.`
      }
    ];

    if (screenshotDataUrl) {
      userContent.push({
        type: "image_url",
        image_url: { url: screenshotDataUrl, detail: "low" }
      });
    }

    // Operator-chosen sensible defaults (context aware) — user overrides win.
    const isEarly = step < 3;
    const needsCare = !!screenshotDataUrl || step > 5;
    const baseParams: InferenceParams = {
      reasoning_effort: isEarly ? 'low' : (needsCare ? 'medium' : 'low'),
      temperature: 0.2,
      top_p: 0.9,
      max_output_tokens: isEarly ? 350 : 520,
    };
    const finalParams = mergeInferenceParams(baseParams, overrides);

    // Model tiering: a DOM-only step (no screenshot) is a cheap "doer" decision — use the
    // small fast text model. Only pay for the vision-capable model when an image is attached.
    const effectiveModel = screenshotDataUrl ? this.model : this.textModel;

    const cacheKey = `browser-action-${effectiveModel}-${(task || '').slice(0, 28).replace(/\s/g, '_')}-${step}`;

    const decision = await callXaiStructured<BrowserActionDecision>({
      apiKey: this.apiKey,
      model: effectiveModel,
      system,
      userContent,
      schemaName: 'BrowserAction',
      schema: actionSchema,
      inference: {
        reasoning_effort: finalParams.reasoning_effort,
        temperature: finalParams.temperature,
        top_p: finalParams.top_p,
        max_output_tokens: finalParams.max_output_tokens,
      },
      cacheKey,
      onRawResponse: this.onRaw,
      abortSignal: undefined, // caller manages abort at operator level
    });

    return decision;
  }
}
