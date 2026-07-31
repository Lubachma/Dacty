import { db } from './db';
import { challengerProgressSchema } from './schemas';
import type { ChallengerProgress } from './types';
import type { Language } from '@/texts/types';
import { getOfficialTexts } from '@/texts/corpus';
import { tierForPoints, tierRank, type Tier } from '@/scoring/league';

const empty = (language: Language): ChallengerProgress => ({
  language, bestByText: {}, total: 0, tier: null, tierHistory: [],
});

export async function getProgress(language: Language): Promise<ChallengerProgress> {
  const raw = await db.challenger.get(language);
  if (!raw) return empty(language);
  const parsed = challengerProgressSchema.safeParse(raw);
  return parsed.success ? parsed.data : empty(language);
}

export async function recordChallengerResult(
  language: Language,
  textId: string,
  points: number,
  now: number,
): Promise<{ progress: ChallengerProgress; tierUp: Tier | null }> {
  const current = await getProgress(language);
  const bestByText = {
    ...current.bestByText,
    [textId]: Math.max(current.bestByText[textId] ?? 0, points),
  };
  const officialIds = new Set(getOfficialTexts(language).map((t) => t.id));
  const total = Object.entries(bestByText)
    .filter(([id]) => officialIds.has(id))
    .reduce((sum, [, p]) => sum + p, 0);
  const tier = tierForPoints(total);
  const tierUp = tier !== null && (current.tier === null || tierRank(tier) > tierRank(current.tier))
    ? tier
    : null;
  const tierHistory = tierUp ? [...current.tierHistory, { tier: tierUp, at: now }] : current.tierHistory;
  const progress: ChallengerProgress = { language, bestByText, total, tier, tierHistory };
  await db.challenger.put(progress);
  return { progress, tierUp };
}
