/**
 * LoginSpecialist
 *
 * Narrow low-token "prompt agent" specialist focused exclusively on authentication surfaces.
 *
 * Input: the same cheap obs + optional screenshot + task context that the main browser reasoner sees.
 * Output: a high-level LoginStrategy (not raw click/type). The thin executor (BrowserOperator)
 * turns the strategy into concrete safe actions that go through the existing secure credential injection path.
 *
 * Benefits:
 * - Even smaller context than the general BrowserActionReasoner.
 * - Reusable across browser operator and future mobile operator.
 * - Explicitly loads the secure-login skill.
 * - Returns guidance the UI / executive can surface ("Login form detected for tinder.com — using stored credentials").
 */

import { SpecialistContext, LoginStrategy, PromptReasoner, loadSkills, mergeInferenceParams, InferenceParams } from './types';
import { callXaiStructured } from './xaiClient';

export class LoginSpecialist implements PromptReasoner<SpecialistContext, LoginStrategy> {
  readonly name = 'LoginSpecialist';
  readonly description = 'Detects login / auth walls and produces a safe high-level strategy that the execution layer turns into credential-injected actions. Never emits real secrets.';

  private apiKey: string;
  private model: string;
  private onRaw?: (raw: string) => void;

  constructor(opts: { apiKey: string; model?: string; onRawResponse?: (raw: string) => void }) {
    this.apiKey = opts.apiKey;
    this.model = opts.model || 'grok-4.3';
    this.onRaw = opts.onRawResponse;
  }

  async decide(input: SpecialistContext, overrides: Record<string, any> = {}): Promise<LoginStrategy> {
    const skills = input.skills || loadSkills('skills/visual-browser'); // pulls in secure-login.md among others

    const schema = {
      type: "object",
      properties: {
        thought: { type: "string", description: "Very short: do I see a login surface? What is the domain? Any session already active?" },
        needsCredentials: { type: "boolean" },
        domain: { type: "string" },
        usernameFieldHint: { type: "string", description: "Description or approximate selector for the email/username field" },
        passwordFieldHint: { type: "string" },
        submitHint: { type: "string", description: "Text or selector for the submit/login button" },
        nextAction: { type: "string", enum: ["click", "type", "goto", "extract", "done"] },
        target: { type: "string", description: "url, selector, or high-level instruction containing 'use stored credentials for the current domain'" },
        notes: { type: "string" }
      },
      required: ["thought", "needsCredentials", "domain", "nextAction"],
      additionalProperties: false
    };

    const system = `You are LoginSpecialist — a tiny, high-precision sub-agent that ONLY handles authentication.

${skills ? 'Loaded Skills (especially Secure Login):\n' + skills : ''}

Rules:
- Output ONLY a high-level strategy. Never output real usernames, passwords, emails, or tokens.
- If you see a login form (email + password fields, or "Log in" / "Sign in" buttons on an auth domain), set needsCredentials true and give good field hints (usernameFieldHint, passwordFieldHint, submitHint).
- Always put the high-level instruction "perform secure login for the current domain using stored credentials" (or similar) in the target so the driver can trigger secure injection.
- The strategy is turned into actions by the driver (type marker on hinted field, click submit, etc.). Your job is to give the hints and the marker; do not stop at recommending the specialist — the main loop will continue with the next concrete action after injection.
- If you believe a persisted session is active, prefer nextAction 'done'.
- Keep thoughts to one sentence.

You are called when the page likely contains an auth surface or the overall task mentions login.`;

    const userText = `Task: ${input.task}\nStep: ${input.step}\nDomain hint: ${input.domain || 'unknown'}\n\nCheap observation:\n${input.cheapObservation}\n\nDecide the login strategy.`;

    const userContent: any[] = [{ type: 'text', text: userText }];
    if (input.screenshotDataUrl) {
      userContent.push({ type: 'image_url', image_url: { url: input.screenshotDataUrl, detail: 'low' } });
    }

    const base: InferenceParams = {
      reasoning_effort: 'low', // login detection is usually straightforward pattern matching
      temperature: 0.1,
      top_p: 0.9,
      max_output_tokens: 320,
    };
    const final = mergeInferenceParams(base, overrides);

    const strategy = await callXaiStructured<LoginStrategy>({
      apiKey: this.apiKey,
      model: this.model,
      system,
      userContent,
      schemaName: 'LoginStrategy',
      schema,
      inference: {
        reasoning_effort: final.reasoning_effort,
        temperature: final.temperature,
        top_p: final.top_p,
        max_output_tokens: final.max_output_tokens,
      },
      cacheKey: `login-${(input.task || '').slice(0, 20).replace(/\s/g, '_')}`,
      onRawResponse: this.onRaw,
    });

    // Guarantee a safe default target if the specialist was vague
    if (strategy && strategy.needsCredentials && !strategy.target) {
      strategy.target = 'perform secure login for the current domain using stored credentials';
    }

    return strategy;
  }
}
