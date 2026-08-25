import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db/db';
import { createRun, typeChar } from '@/engine/typingEngine';
import { completeRun, type RunConfig } from './runFlow';
import { ALL_OPTIONS_ON } from '@/texts/normalize';
import { allRuns } from '@/db/runsRepo';

const config: RunConfig = {
  mode: 'free', language: 'fr', textId: 'fr-001', options: ALL_OPTIONS_ON,
};

/** Types the whole text, 600ms per character, no errors. */
function finishClean(text: string) {
  let s = createRun(text);
  for (let i = 0; i < text.length; i++) s = typeChar(s, text[i], 1000 + i * 600);
  return s;
}

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('completeRun', () => {
  it('sauvegarde la run avec wpm, précision et points corrects', async () => {
    const text = 'abcdefghij'; // 10 chars in 5.4s -> 22.22 WPM
    const state = finishClean(text);
    const result = await completeRun(state, config, 9999);
    expect(result.run.wpm).toBeCloseTo(22.22, 1);
    expect(result.run.accuracy).toBe(1);
    expect(result.run.points).toBe(Math.round(22.22 * 1.4));
    expect(result.run.chars).toBe(10);
    expect(result.run.noBackspace).toBe(true);
    expect(await allRuns()).toHaveLength(1);
    expect(result.newRecords).toEqual(['wpm', 'accuracy', 'longest']); // 1st run
  });

  it('pénalise la précision si des erreurs ont été corrigées', async () => {
    let s = createRun('ab');
    s = typeChar(s, 'x', 1000); // error
    const { pressBackspace } = await import('@/engine/typingEngine');
    s = pressBackspace(s, 1200);
    s = typeChar(s, 'a', 1800);
    s = typeChar(s, 'b', 2400);
    const result = await completeRun(s, config, 9999);
    expect(result.run.accuracy).toBeCloseTo(2 / 3, 2); // 3 keystrokes, 1 error
    expect(result.run.noBackspace).toBe(false);
    expect(result.timeline.length).toBeGreaterThan(0);
  });

  it('ne détecte pas de record si un meilleur wpm existe déjà', async () => {
    await completeRun(finishClean('abcdefghij'), config, 9999); // ~22 WPM
    const slow = createRun('ab');
    let s = typeChar(slow, 'a', 1000);
    s = typeChar(s, 'b', 11_000); // 2 chars in 10s -> 2.4 WPM
    const result = await completeRun(s, config, 99_999);
    expect(result.newRecords).not.toContain('wpm');
  });

  it('en mode challenger, met à jour la ligue et retourne tierUp', async () => {
    const c: RunConfig = { ...config, mode: 'challenger', textId: 'fr-101' };
    // very fast run: 200 chars in 11.94s -> (200/5)/0.199min = 201 WPM -> round(201×1.4) = 281 pts -> bronze right away
    const text = 'a'.repeat(200);
    let s = createRun(text);
    for (let i = 0; i < 200; i++) s = typeChar(s, 'a', 1000 + i * 60);
    const result = await completeRun(s, c, 9999);
    expect(result.progress?.total).toBe(281);
    expect(result.tierUp).toBe('bronze');
    expect(result.newAchievements.map((a) => a.id)).toContain('enter-league');
    expect(result.newAchievements.map((a) => a.id)).toContain('wpm-140');
  });

  it('est atomique : si la persistance échoue, rien n\'est enregistré', async () => {
    const c: RunConfig = { ...config, mode: 'challenger', textId: 'fr-101' };
    // unlockNew calls bulkAdd even with no new achievements: the failure is guaranteed
    vi.spyOn(db.achievements, 'bulkAdd').mockRejectedValueOnce(new Error('boom'));
    await expect(completeRun(finishClean('abcdefghij'), c, 9999)).rejects.toThrow('boom');
    expect(await allRuns()).toHaveLength(0); // the run is rolled back…
    expect(await db.challenger.get('fr')).toBeUndefined(); // …and so is the progress
  });
});
