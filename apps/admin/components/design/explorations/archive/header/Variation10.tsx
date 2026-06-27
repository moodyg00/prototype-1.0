import { Settings } from 'lucide-react';

// @mock-start
const MOCK_ISSUE_LABEL = 'No. 04 / Issue 26';
const MOCK_WORDMARK = 'PROTO·2';
const MOCK_SUBTITLE = 'Business Operating System';
const MOCK_NAV: ReadonlyArray<string> = ['Operations', 'Clients', 'Finance', 'Reports', 'Settings'];
// @mock-end

export interface HeaderEditorialProps {
  issueLabel?: string;
  wordmark?: string;
  subtitle?: string;
  nav?: ReadonlyArray<string>;
}

export function HeaderEditorial({
  issueLabel = MOCK_ISSUE_LABEL,
  wordmark = MOCK_WORDMARK,
  subtitle = MOCK_SUBTITLE,
  nav = MOCK_NAV,
}: HeaderEditorialProps) {
  return (
    <header
      className="w-full"
      style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="relative flex h-20 items-center px-8">
        <div
          className="text-[11px] uppercase tracking-[0.32em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {issueLabel}
        </div>

        <div className="-translate-x-1/2 absolute left-1/2 flex flex-col items-center">
          <div className="font-semibold text-2xl tracking-[0.18em]">{wordmark}</div>
          <div
            className="mt-1 text-[10px] uppercase tracking-[0.28em]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {subtitle}
          </div>
        </div>

        <button
          type="button"
          className="ml-auto inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] transition-colors hover:text-[var(--foreground)]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <Settings className="size-3.5" />
          Settings
        </button>
      </div>

      <div
        className="flex items-center justify-center gap-6 px-8 py-2 text-[11px] uppercase tracking-[0.22em]"
        style={{
          borderTop: '1px solid var(--border)',
          color: 'var(--muted-foreground)',
        }}
      >
        {nav.map((item, idx) => (
          <span key={item} className="contents">
            {idx > 0 && <span className="opacity-40">·</span>}
            <a href="#" className="transition-colors hover:text-[var(--foreground)]">
              {item}
            </a>
          </span>
        ))}
      </div>
    </header>
  );
}
