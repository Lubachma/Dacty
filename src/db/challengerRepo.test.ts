import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { getProgress, recordChallengerResult } from './challengerRepo';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('challengerRepo', () => {
  it('retourne une progression vide par défaut', async () => {
    const p = await getProgress('fr');
    expect(p).toEqual({ language: 'fr', bestByText: {}, total: 0, tier: null, tierHistory: [] });
  });

  it('garde le meilleur score par texte et calcule le total', async () => {
    await recordChallengerResult('fr', 'fr-101', 50, 1000);
    const r = await recordChallengerResult('fr', 'fr-101', 40, 2000); // moins bien
    expect(r.progress.bestByText['fr-101']).toBe(50);
    const r2 = await recordChallengerResult('fr', 'fr-102', 60, 3000);
    expect(r2.progress.total).toBe(110);
    expect(r2.progress.tier).toBe('bronze');
  });

  it('détecte la montée de tier et l\'historise', async () => {
    await recordChallengerResult('fr', 'fr-101', 50, 1000);
    const r = await recordChallengerResult('fr', 'fr-102', 60, 3000); // total 110 -> bronze
    expect(r.tierUp).toBe('bronze');
    expect(r.progress.tierHistory).toEqual([{ tier: 'bronze', at: 3000 }]);
    // re-run sans changement de tier
    const r2 = await recordChallengerResult('fr', 'fr-103', 80, 4000); // total 190
    expect(r2.tierUp).toBeNull();
    expect(r2.progress.tierHistory).toHaveLength(1);
  });
});
