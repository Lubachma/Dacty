interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  /** texte d'accessibilité du graphe (traduit par l'appelant) */
  label: string;
}

export function Sparkline({ data, width = 280, height = 48, label }: SparklineProps) {
  if (data.length === 0) return null;
  const max = Math.max(1, ...data);
  const step = width / Math.max(1, data.length - 1);
  const points = data
    .map((v, i) => `${Math.round(i * step)},${Math.round(height - (v / max) * (height - 4) - 2)}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="h-auto w-full overflow-visible">
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
