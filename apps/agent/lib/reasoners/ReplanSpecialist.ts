import type { SpecialistContext } from './types';

export type ReplanStrategy = {
  reason: string;
  nextGoals: string[];
  confidence: number;
};

export async function recommendReplanStrategy(ctx: SpecialistContext): Promise<ReplanStrategy> {
  return {
    reason: 'Loop or blocked state detected; suggest a fresh plan.',
    nextGoals: [
      'Re-read the current page state',
      ctx.task ? `Re-focus on goal: ${ctx.task}` : 'Clarify the primary goal',
      'Try an alternate navigation path',
    ],
    confidence: 0.55,
  };
}