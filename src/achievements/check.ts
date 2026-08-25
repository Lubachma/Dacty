import { db } from '@/db/db';
import { allRuns } from '@/db/runsRepo';
import { getProgress } from '@/db/challengerRepo';
import type { RunRecord } from '@/db/types';
import {
  ACHIEVEMENTS, type AchievementContext, type AchievementDef,
} from './definitions';

const dayKey = (ts: number): string => new Date(ts).toDateString();

/** Consecutive days played; the streak may end today or yesterday. */
export function computeStreak(dates: number[], now: number): number {
  const days = new Set(dates.map(dayKey));
  const cursor = new Date(now);
  cursor.setHours(12, 0, 0, 0);
  if (!days.has(cursor.toDateString())) cursor.setTime(cursor.getTime() - 86_400_000);
  let streak = 0;
  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setTime(cursor.getTime() - 86_400_000);
  }
  return streak;
}

export async function buildContext(newRun: RunRecord): Promise<AchievementContext> {
  const [runs, fr, en, c, python] = await Promise.all([
    allRuns(), getProgress('fr'), getProgress('en'), getProgress('c'), getProgress('python'),
  ]);
  return {
    newRun,
    runs,
    totalChars: runs.reduce((sum, r) => sum + r.chars, 0),
    streakDays: computeStreak(runs.map((r) => r.date), Date.now()),
    progress: { fr, en, c, python },
    now: Date.now(),
  };
}

/** Persists and returns only the newly unlocked achievements. */
export async function unlockNew(ctx: AchievementContext): Promise<AchievementDef[]> {
  const already = new Set((await db.achievements.toArray()).map((a) => a.id));
  const fresh = ACHIEVEMENTS.filter((a) => !already.has(a.id) && a.isUnlocked(ctx));
  await db.achievements.bulkAdd(fresh.map((a) => ({ id: a.id, unlockedAt: ctx.now })));
  return fresh;
}
