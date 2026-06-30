/**
 * Shared types for prompt-based reasoners and the Operator contract.
 * Visual-first: reasoner receives screenshot + cheap DOM data to understand interactables.
 */

import { AgentEvent } from '../operators/types';

export type InferenceParams = {
  reasoning_effort?: 'low' | 'medium' | 'high';
  temperature?: number;
  top_p?: number;
  max_output_tokens?: number;
};

// Generic input most browser/GUI specialists receive (cheap + selective vision + step + skills).
export interface SpecialistContext {
  task: string;
  cheapObservation: string;
  screenshotDataUrl?: string | null; // only when page actually changed (cost control)
  step: number;
  domain?: string | null;
  // Injected skills (from skills/ dir). Reasoners can load additional narrow ones.
  skills?: string;
  // User overrides (from UI) always win over the reasoner's operator-chosen defaults.
  inferenceOverrides?: Record<string, any>;
  // Current no-progress counter from the thin driver. High values mean repeated actions without observable page change.
  // The reasoner should use this to break loops: prefer 'extract' or 'done' with what is visible now.
  noProgressCount?: number;
}

// The classic low-level browser action the original loop used.
// Kept for compatibility during refactor; specialists can return richer intents later.
export interface BrowserActionDecision {
  thought: string;
  action: 'goto' | 'click' | 'type' | 'scroll' | 'extract' | 'search_web' | 'done';
  url?: string;
  selector?: string;
  x?: number;
  y?: number;
  text?: string;
  final_answer?: string;
}

// High-level intent from a specialist (e.g. LoginSpecialist).
// The thin executor in the operator turns this into concrete BrowserActionDecision(s).
export interface LoginStrategy {
  thought: string;
  needsCredentials: boolean;
  domain: string;
  usernameFieldHint?: string; // e.g. "email or phone", selector guidance
  passwordFieldHint?: string;
  submitHint?: string;        // button text or selector
  nextAction: 'click' | 'type' | 'goto' | 'extract' | 'done';
  target?: string;            // url or selector or "use stored credentials for ..."
  notes?: string;
}

// Executive / planner output. Emitted as 'plan' events so UI + humans can see/approve.
export interface PlanStep {
  step: number;
  operatorId: string;   // e.g. 'browser-operator', 'firecrawl', 'creation-video'
  subPrompt: string;    // the focused sub-task to hand to the leaf operator
  successCriteria?: string;
  dependsOn?: number[];
}

export interface HighLevelPlan {
  goal: string;
  steps: PlanStep[];
  estimatedSteps?: number;
  notes?: string; // e.g. "Will use LoginSpecialist before low-level browser steps"
}

// Base shape for a prompt-based reasoner (the "prompt agent" primitive).
// Implementations are intentionally small-context + strict structured outputs.
export interface PromptReasoner<TInput = SpecialistContext, TOutput = BrowserActionDecision> {
  readonly name: string;
  readonly description: string;

  // Core: one focused, low-token LLM decision.
  decide(input: TInput, overrides?: InferenceParams): Promise<TOutput>;

  // Optional: expose the exact system + user prompt for audit / debugging.
  buildPrompt?(input: TInput): { system: string; userText: string };
}

// Helper event for rich plan emission (uses the existing 'plan' EventType).
export function makePlanEvent(plan: HighLevelPlan | string, extra?: Partial<AgentEvent>): AgentEvent {
  const content = typeof plan === 'string' ? plan : `Plan for "${plan.goal}": ${plan.steps.length} steps via ${plan.steps.map(s => s.operatorId).join(' → ')}`;
  return {
    id: (Math.random().toString(36).slice(2, 10) + Date.now().toString(36)),
    ts: Date.now(),
    type: 'plan',
    content,
    ...extra,
  } as AgentEvent;
}

// Shared skill loader (used by operators today; now also by reasoners).
// Looks for markdown under skills/<category>/*.md
export function loadSkills(skillDir = 'skills/visual-browser'): string {
  // Dynamic import of fs to keep this usable in both server/client contexts if needed.
  // In practice this file is only required server-side (API routes + operator singletons).
  const fs = require('fs');
  const path = require('path');
  const dir = path.join(process.cwd(), skillDir);
  if (!fs.existsSync(dir)) return '';
  const files = fs.readdirSync(dir).filter((f: string) => f.endsWith('.md'));
  return files
    .map((f: string) => {
      const content = fs.readFileSync(path.join(dir, f), 'utf8');
      return `### Skill: ${f.replace('.md', '')}\n${content}\n`;
    })
    .join('\n');
}

// Selective skill loader: load only the named skill files (without the .md extension).
// Used to keep the worker prompt tight — load navigation by default, and only add the
// login or extraction skill when the current page context actually calls for it.
export function loadSkillFiles(names: string[], skillDir = 'skills/visual-browser'): string {
  const fs = require('fs');
  const path = require('path');
  const dir = path.join(process.cwd(), skillDir);
  if (!fs.existsSync(dir)) return '';
  return names
    .map((name: string) => {
      const file = path.join(dir, `${name}.md`);
      if (!fs.existsSync(file)) return '';
      return `### Skill: ${name}\n${fs.readFileSync(file, 'utf8')}\n`;
    })
    .filter(Boolean)
    .join('\n');
}

// Small helper to compute final inference params (operator-chosen base + user overrides).
export function mergeInferenceParams(
  base: InferenceParams,
  overrides: Record<string, any> = {}
): Required<InferenceParams> & Record<string, any> {
  return {
    reasoning_effort: (overrides.reasoning_effort ?? base.reasoning_effort ?? 'low') as any,
    temperature: overrides.temperature ?? base.temperature ?? 0.2,
    top_p: overrides.top_p ?? base.top_p ?? 0.9,
    max_output_tokens: overrides.max_output_tokens ?? base.max_output_tokens ?? 450,
    ...overrides,
  };
}
