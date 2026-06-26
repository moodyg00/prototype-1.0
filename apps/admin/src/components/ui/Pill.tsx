import React from 'react';

/**
 * Pill — palette-aware badge/chip.
 *
 * Colors are driven by CSS variables that ThemeProvider swaps on <html>.
 * When COSS `<Badge>` is installed, you can replace usages of this component
 * with `<Badge variant="success">…</Badge>` without changing the visual
 * design system because COSS Badge tokens inherit the same variables.
 */
export type PillTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';

interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
}

export function Pill({ tone = 'neutral', className, ...rest }: PillProps) {
  return <span className={`pill${className ? ' ' + className : ''}`} data-tone={tone} {...rest} />;
}
