import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db/db';
import { ALL_OPTIONS_ON } from '@/texts/normalize';

vi.mock('@/game/runFlow', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/game/runFlow')>();
  return {
    ...original,
    completeRun: () => Promise.reject(new Error('IndexedDB blocked')),
  };
});

import { useRunStore } from './runStore';
import { useToasts } from './toastStore';
import { setUiLanguage } from '@/test/i18n';

const config = { mode: 'free' as const, language: 'fr' as const, textId: 'fr-001', options: ALL_OPTIONS_ON };

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  useRunStore.getState().reset();
  useToasts.setState({ toasts: [] });
  setUiLanguage('fr');
});

describe('runStore sans persistance', () => {
  it('affiche quand même les résultats et avertit', async () => {
    useRunStore.getState().start(config, 'ab');
    useRunStore.getState().key('a');
    useRunStore.getState().key('b');
    expect(useRunStore.getState().status).toBe('finished');
    await vi.waitFor(() => expect(useRunStore.getState().result).not.toBeNull());
    const result = useRunStore.getState().result!;
    expect(result.run.chars).toBe(2);
    expect(result.newAchievements).toEqual([]);
    expect(result.newRecords).toEqual([]);
    expect(useToasts.getState().toasts.some((t) => t.title === 'Sauvegarde impossible')).toBe(true);
    expect(await db.runs.count()).toBe(0);
  });
});
