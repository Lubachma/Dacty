import type { Tier } from '@/scoring/league';

const LABELS: Record<Tier, string> = {
  bronze: 'Bronze',
  argent: 'Argent',
  or: 'Or',
  platine: 'Platine',
  diamant: 'Diamant',
  challenger: 'Challenger',
};

const COLORS: Record<Tier, string> = {
  bronze: 'bg-amber-800/30 text-amber-500 border-amber-700',
  argent: 'bg-slate-500/20 text-slate-300 border-slate-500',
  or: 'bg-yellow-500/20 text-yellow-400 border-yellow-600',
  platine: 'bg-cyan-500/20 text-cyan-300 border-cyan-600',
  diamant: 'bg-blue-500/20 text-blue-300 border-blue-500',
  challenger: 'bg-purple-500/20 text-purple-300 border-purple-500',
};

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className={`rounded-full border px-3 py-0.5 text-xs font-bold uppercase tracking-wide ${COLORS[tier]}`}>
      {LABELS[tier]}
    </span>
  );
}

export function tierLabel(tier: Tier): string {
  return LABELS[tier];
}
