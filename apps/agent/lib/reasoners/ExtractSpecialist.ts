import type { SpecialistContext } from './types';

export type ExtractStrategy = {
  selectors: string[];
  hints: string[];
  confidence: number;
};

export async function recommendExtractStrategy(_ctx: SpecialistContext): Promise<ExtractStrategy> {
  return {
    selectors: ['main', 'article', '[role="main"]'],
    hints: ['Prefer visible text near headings', 'Skip nav/footer chrome'],
    confidence: 0.6,
  };
}