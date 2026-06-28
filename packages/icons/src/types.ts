import type { SVGProps } from 'react';

export interface SvgIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
  title?: string;
}