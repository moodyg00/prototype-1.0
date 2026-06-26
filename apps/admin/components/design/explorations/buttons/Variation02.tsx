import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ButtonSizeKey = 'xs' | 'sm' | 'default' | 'lg' | 'xl';
type ButtonIconSizeKey =
  | 'icon-xs'
  | 'icon-sm'
  | 'icon'
  | 'icon-lg'
  | 'icon-xl';

type SizeEntry = { size: ButtonSizeKey; label: string; desc: string };
type IconSizeEntry = { size: ButtonIconSizeKey; label: string };

// @mock-start
const MOCK_SIZES: SizeEntry[] = [
  { size: 'xs', label: 'xs', desc: 'h-6 / 12px text' },
  { size: 'sm', label: 'sm', desc: 'h-7 / 13px text' },
  { size: 'default', label: 'default', desc: 'h-8 / 14px text' },
  { size: 'lg', label: 'lg', desc: 'h-9 / 14px text' },
  { size: 'xl', label: 'xl', desc: 'h-10 / 16px text' },
];

const MOCK_ICON_SIZES: IconSizeEntry[] = [
  { size: 'icon-xs', label: 'icon-xs' },
  { size: 'icon-sm', label: 'icon-sm' },
  { size: 'icon', label: 'icon' },
  { size: 'icon-lg', label: 'icon-lg' },
  { size: 'icon-xl', label: 'icon-xl' },
];
// @mock-end

export interface ButtonSizeRhythmProps {
  sizes?: ReadonlyArray<SizeEntry>;
  iconSizes?: ReadonlyArray<IconSizeEntry>;
}

export function ButtonSizeRhythm({
  sizes = MOCK_SIZES,
  iconSizes = MOCK_ICON_SIZES,
}: ButtonSizeRhythmProps = {}) {
  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <div className="space-y-3">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Text — consistent rhythm
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {sizes.map(({ size, label, desc }) => (
            <div key={label} className="flex flex-col items-start gap-1.5">
              <Button size={size}>
                <Plus />
                {label}
              </Button>
              <span
                className="font-mono text-[10px]"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Icon-only
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {iconSizes.map(({ size, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <Button size={size} variant="outline" aria-label={label}>
                <Plus />
              </Button>
              <span
                className="font-mono text-[10px]"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
