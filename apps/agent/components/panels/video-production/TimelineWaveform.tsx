'use client';

const PX_PER_SEC = 48;

export function TimelineWaveform({
  durationMs,
  peaks,
  beatMarkersMs,
}: {
  durationMs: number;
  peaks: number[];
  beatMarkersMs: number[];
}) {
  const widthPx = Math.max(320, (durationMs / 1000) * PX_PER_SEC + 80);
  const h = 32;

  return (
    <div className="relative h-8 w-full" style={{ minWidth: widthPx }}>
      <svg width="100%" height={h} className="absolute inset-0 text-violet-500/50" preserveAspectRatio="none">
        {peaks.length > 0 && (
          <path
            fill="currentColor"
            d={peaks
              .map((p, i) => {
                const x = (i / peaks.length) * 100;
                const barH = p * h;
                return `${i === 0 ? 'M' : 'L'} ${x}% ${h - barH}`;
              })
              .join(' ')}
          />
        )}
      </svg>
      {beatMarkersMs.map((ms) => (
        <div
          key={ms}
          className="absolute top-0 bottom-0 w-px bg-amber-400/60"
          style={{ left: (ms / 1000) * PX_PER_SEC }}
          title={`Beat ${ms}ms`}
        />
      ))}
    </div>
  );
}