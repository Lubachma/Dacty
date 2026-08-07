import { db } from './db';
import { runRecordSchema } from './schemas';
import type { GameMode, RunRecord } from './types';
import type { Language } from '@/texts/types';

export async function saveRun(run: RunRecord): Promise<number> {
  // l'id auto-incrémenté est toujours un number à l'exécution
  return db.runs.add(run) as Promise<number>;
}

/** Écarte les lignes corrompues (IndexedDB modifiable hors de l'app) plutôt que de planter. */
function parseRuns(rows: unknown[]): RunRecord[] {
  const valid: RunRecord[] = [];
  let dropped = 0;
  for (const row of rows) {
    const parsed = runRecordSchema.safeParse(row);
    if (parsed.success) valid.push(parsed.data);
    else dropped += 1;
  }
  if (dropped > 0) console.warn(`[dacty] ${dropped} run(s) corrompue(s) ignorée(s)`);
  return valid;
}

/** Prédicat de validation pour les filtres de requêtes d'index (curseur paresseux). */
function isValidRun(r: RunRecord): boolean {
  return runRecordSchema.safeParse(r).success;
}

const keyOf = (mode: GameMode, r: RunRecord): number => (mode === 'challenger' ? r.points : r.wpm);

export async function topRuns(
  filter: { mode: GameMode; language: Language; textId?: string },
  limit = 10,
): Promise<RunRecord[]> {
  const runs = parseRuns(
    await db.runs
      .where(filter.textId ? '[mode+language+textId]' : 'mode')
      .equals(filter.textId ? [filter.mode, filter.language, filter.textId] : filter.mode)
      .toArray(),
  );
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

export async function allRuns(): Promise<RunRecord[]> {
  return parseRuns(await db.runs.toArray());
}

export async function recentRuns(limit = 5): Promise<RunRecord[]> {
  return parseRuns(await db.runs.orderBy('date').reverse().limit(limit).toArray());
}

export function runCount(): Promise<number> {
  return db.runs.count();
}

export async function personalBests(): Promise<{
  bestWpm: RunRecord | null;
  bestAccuracy: RunRecord | null;
  longestRun: RunRecord | null;
}> {
  // requêtes d'index paresseuses : le curseur s'arrête au premier match valide,
  // sans charger la table (les lignes corrompues sont écartées par le filtre)
  const bestWpm = (await db.runs.orderBy('wpm').reverse().filter(isValidRun).first()) ?? null;
  const bestAccuracy =
    (await db.runs
      .orderBy('accuracy')
      .reverse()
      .filter((r) => r.durationMs >= 10_000 && isValidRun(r))
      .first()) ?? null;
  const longestRun = (await db.runs.orderBy('chars').reverse().filter(isValidRun).first()) ?? null;
  return { bestWpm, bestAccuracy, longestRun };
}
