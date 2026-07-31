import { db } from './db';
import type { GameMode, RunRecord } from './types';
import type { Language } from '@/texts/types';

export async function saveRun(run: RunRecord): Promise<number> {
  // l'id auto-incrémenté est toujours un number à l'exécution
  return db.runs.add(run) as Promise<number>;
}

const keyOf = (mode: GameMode, r: RunRecord): number => (mode === 'challenger' ? r.points : r.wpm);

export async function topRuns(
  filter: { mode: GameMode; language: Language; textId?: string },
  limit = 10,
): Promise<RunRecord[]> {
  const runs = await db.runs
    .where(filter.textId ? '[mode+language+textId]' : 'mode')
    .equals(filter.textId ? [filter.mode, filter.language, filter.textId] : filter.mode)
    .toArray();
  return runs
    .filter((r) => r.language === filter.language && (!filter.textId || r.textId === filter.textId))
    .sort((a, b) => keyOf(filter.mode, b) - keyOf(filter.mode, a) || a.date - b.date)
    .slice(0, limit);
}

export async function rankFor(
  filter: { mode: GameMode; language: Language; textId: string },
  key: number,
): Promise<number> {
  const better = await db.runs
    .where('[mode+language+textId]')
    .equals([filter.mode, filter.language, filter.textId])
    .filter((r) => keyOf(filter.mode, r) > key)
    .count();
  return better + 1;
}

export function allRuns(): Promise<RunRecord[]> {
  return db.runs.toArray();
}

export function runCount(): Promise<number> {
  return db.runs.count();
}

export async function personalBests(): Promise<{
  bestWpm: RunRecord | null;
  bestAccuracy: RunRecord | null;
  longestRun: RunRecord | null;
}> {
  const runs = await db.runs.toArray();
  const max = (list: RunRecord[], key: (r: RunRecord) => number): RunRecord | null =>
    list.length === 0 ? null : list.reduce((a, b) => (key(b) > key(a) ? b : a));
  return {
    bestWpm: max(runs, (r) => r.wpm),
    bestAccuracy: max(runs.filter((r) => r.durationMs >= 10_000), (r) => r.accuracy),
    longestRun: max(runs, (r) => r.chars),
  };
}
