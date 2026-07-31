import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { buildContext, computeStreak, unlockNew } from './check';
import type { RunRecord } from '@/db/types';

const opts = { punctuation: true, specialChars: true, digits: true, accents: true };

function run(patch: Partial<RunRecord>): RunRecord {
  return {
    date: Date.now(), mode: 'free', language: 'fr', textId: 'fr-001', options: opts,
    durationMs: 30_000, wpm: 60, accuracy: 0.97, points: 79, errors: 3,
    backspaces: 1, chars: 250, noBackspace: false, ...patch,
  };
}

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('computeStreak', () => {
  const day = (offset: number) => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d.getTime() - offset * 86_400_000;
  };

  it('compte les jours consécutifs en remontant depuis aujourd\'hui', () => {
    expect(computeStreak([day(0), day(1), day(2), day(4)], Date.now())).toBe(3);
    expect(computeStreak([day(1), day(2)], Date.now())).toBe(2); // streak active sans run aujourd'hui
    expect(computeStreak([day(5)], Date.now())).toBe(0);
    expect(computeStreak([], Date.now())).toBe(0);
  });

  it('ne compte qu\'une fois plusieurs runs le même jour', () => {
    expect(computeStreak([day(0), day(0), day(1)], Date.now())).toBe(2);
  });
});

describe('unlockNew', () => {
  it('débloque une seule fois, persiste en DB', async () => {
    const newRun = run({ wpm: 65 });
    const ctx1 = await buildContext(newRun);
    const first = await unlockNew(ctx1);
    expect(first.map((a) => a.id)).toContain('wpm-60');
    expect(first.map((a) => a.id)).not.toContain('wpm-80');

    const ctx2 = await buildContext(run({ wpm: 66 }));
    const second = await unlockNew(ctx2);
    expect(second.map((a) => a.id)).not.toContain('wpm-60'); // déjà débloqué
    expect(await db.achievements.count()).toBe(first.length);
  });
});
