import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from './db';
import { allRuns, personalBests, rankFor, runCount, saveRun, topRuns } from './runsRepo';
import type { RunRecord } from './types';

const opts = { punctuation: true, specialChars: true, digits: true, accents: true };

function makeRun(patch: Partial<RunRecord>): RunRecord {
  return {
    date: 1000, mode: 'free', language: 'fr', textId: 'fr-001', options: opts,
    durationMs: 30_000, wpm: 50, accuracy: 0.97, points: 66, errors: 3,
    backspaces: 2, chars: 250, noBackspace: false, ...patch,
  };
}

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('runsRepo', () => {
  it('sauvegarde et compte les runs', async () => {
    await saveRun(makeRun({}));
    await saveRun(makeRun({ date: 2000 }));
    expect(await runCount()).toBe(2);
    expect((await allRuns()).map((r) => r.date).sort()).toEqual([1000, 2000]);
  });

  it('topRuns trie par wpm desc en free, points desc en challenger', async () => {
    await saveRun(makeRun({ wpm: 40 }));
    await saveRun(makeRun({ wpm: 60 }));
    await saveRun(makeRun({ wpm: 50 }));
    const top = await topRuns({ mode: 'free', language: 'fr' });
    expect(top.map((r) => r.wpm)).toEqual([60, 50, 40]);

    await saveRun(makeRun({ mode: 'challenger', textId: 'fr-101', points: 80, wpm: 45 }));
    await saveRun(makeRun({ mode: 'challenger', textId: 'fr-101', points: 90, wpm: 44 }));
    const topC = await topRuns({ mode: 'challenger', language: 'fr', textId: 'fr-101' });
    expect(topC.map((r) => r.points)).toEqual([90, 80]);
  });

  it('topRuns respecte la limite et le filtre texte/langue', async () => {
    for (let i = 0; i < 12; i++) await saveRun(makeRun({ wpm: 30 + i, date: i }));
    await saveRun(makeRun({ language: 'en', textId: 'en-001', wpm: 99 }));
    expect(await topRuns({ mode: 'free', language: 'fr' }, 10)).toHaveLength(10);
    const en = await topRuns({ mode: 'free', language: 'en' });
    expect(en).toHaveLength(1);
    expect(en[0].wpm).toBe(99);
  });

  it('rankFor donne le rang 1-based d\'un score', async () => {
    await saveRun(makeRun({ wpm: 60 }));
    await saveRun(makeRun({ wpm: 50 }));
    expect(await rankFor({ mode: 'free', language: 'fr', textId: 'fr-001' }, 55)).toBe(2);
    expect(await rankFor({ mode: 'free', language: 'fr', textId: 'fr-001' }, 70)).toBe(1);
  });

  it('personalBests ignore la précision des runs < 10 s', async () => {
    await saveRun(makeRun({ wpm: 55, accuracy: 0.9, chars: 300, durationMs: 30_000 }));
    await saveRun(makeRun({ wpm: 70, accuracy: 1, chars: 100, durationMs: 5_000 }));
    const bests = await personalBests();
    expect(bests.bestWpm?.wpm).toBe(70);
    expect(bests.bestAccuracy?.accuracy).toBe(0.9);
    expect(bests.longestRun?.chars).toBe(300);
  });

  it('écarte les lignes corrompues à la lecture, avec avertissement', async () => {
    await saveRun(makeRun({}));
    // IndexedDB est modifiable hors de l'app : insertion brute d'une ligne invalide
    await db.runs.add({ ...makeRun({ date: 3000 }), wpm: 'rapide' } as unknown as RunRecord);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect((await allRuns()).map((r) => r.date)).toEqual([1000]);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('topRuns et personalBests ignorent les lignes corrompues', async () => {
    await saveRun(makeRun({ wpm: 50 }));
    // sans validation, cette ligne gagnerait le record de wpm
    await db.runs.add({ ...makeRun({}), wpm: 999, accuracy: 'bof' } as unknown as RunRecord);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect((await topRuns({ mode: 'free', language: 'fr' })).map((r) => r.wpm)).toEqual([50]);
    expect((await personalBests()).bestWpm?.wpm).toBe(50);
    vi.restoreAllMocks();
  });
});
