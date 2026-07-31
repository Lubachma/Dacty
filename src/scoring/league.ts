export const TIERS = ['bronze', 'argent', 'or', 'platine', 'diamant', 'challenger'] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_THRESHOLDS: Record<Tier, number> = {
  bronze: 100,
  argent: 400,
  or: 750,
  platine: 950,
  diamant: 1100,
  challenger: 1300,
};

export function tierRank(tier: Tier): number {
  return TIERS.indexOf(tier);
}

export function tierForPoints(total: number): Tier | null {
  let result: Tier | null = null;
  for (const tier of TIERS) {
    if (total >= TIER_THRESHOLDS[tier]) result = tier;
  }
  return result;
}

export function nextTier(current: Tier | null): { tier: Tier; threshold: number } | null {
  const next = current === null ? TIERS[0] : TIERS[tierRank(current) + 1];
  if (!next) return null;
  return { tier: next, threshold: TIER_THRESHOLDS[next] };
}
