interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
}

export function Sparkline({ data, width = 280, height = 48 }: SparklineProps) {
  if (data.length === 0) return null;
  const max = Math.max(1, ...data);
  const step = width / Math.max(1, data.length - 1);
  const points = data
    .map((v, i) => `${Math.round(i * step)},${Math.round(height - (v / max) * (height - 4) - 2)}`)
    .join(' ');
  return (
    <svg width={width} height={height} role="img" aria-label="Évolution du WPM" className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
