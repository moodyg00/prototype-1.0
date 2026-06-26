// @mock-start
// @mock-end

export interface LoadingIndeterminateShimmerProps {}

export function LoadingIndeterminateShimmer(_props: LoadingIndeterminateShimmerProps = {}) {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <div className="text-sm font-medium">Syncing with QuickBooks</div>
        <div
          className="relative h-1.5 w-full overflow-hidden rounded-full"
          style={{ background: 'var(--muted)' }}
        >
          <div
            className="absolute inset-y-0 -inset-x-1/3 rounded-full"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, var(--primary) 50%, transparent 100%)',
              animation: 'indeterminate-loop 1.4s ease-in-out infinite',
              width: '40%',
            }}
          />
        </div>
        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          We don&apos;t know yet how long this will take. Safe to navigate away.
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Live · streaming events</div>
        <div
          className="relative h-1 w-full overflow-hidden rounded-full"
          style={{ background: 'var(--muted)' }}
        >
          <div
            className="absolute inset-y-0 -inset-x-1/3 rounded-full"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--primary) 60%, var(--background) 40%) 50%, transparent 100%)',
              animation: 'indeterminate-loop 2.4s linear infinite',
              width: '60%',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes indeterminate-loop {
          0% { transform: translateX(0); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );
}
