import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { useRunStore } from './runStore';
import { ALL_OPTIONS_ON } from '@/texts/normalize';

const config = { mode: 'free' as const, language: 'fr' as const, textId: 'fr-001', options: ALL_OPTIONS_ON };

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  useRunStore.getState().reset();
});

describe('runStore', () => {
  it('démarre une run et avance à chaque frappe', () => {
    useRunStore.getState().start(config, 'ab');
    expect(useRunStore.getState().status).toBe('running');
    useRunStore.getState().key('a');
    expect(useRunStore.getState().typing?.cursor).toBe(1);
    useRunStore.getState().backspace();
    expect(useRunStore.getState().typing?.cursor).toBe(0);
  });

  it('termine la run et remplit le résultat', async () => {
    useRunStore.getState().start(config, 'ab');
    useRunStore.getState().key('a');
    useRunStore.getState().key('b');
    expect(useRunStore.getState().status).toBe('finished');
    await vi.waitFor(() => expect(useRunStore.getState().result).not.toBeNull());
    expect(useRunStore.getState().result?.run.chars).toBe(2);
    expect(useRunStore.getState().result?.run.mode).toBe('free');
  });

  it('ignore les frappes quand la run est en pause ou invalidée', () => {
    useRunStore.getState().start(config, 'ab');
    useRunStore.getState().key('a');
    useRunStore.getState().pause();
    useRunStore.getState().key('b');
    expect(useRunStore.getState().typing?.cursor).toBe(1);
    useRunStore.getState().resume();
    useRunStore.getState().invalidate();
    useRunStore.getState().key('b');
    expect(useRunStore.getState().status).toBe('invalidated');
  });
});
