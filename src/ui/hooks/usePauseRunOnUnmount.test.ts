import 'fake-indexeddb/auto';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { useRunStore } from '@/state/runStore';
import { usePauseRunOnUnmount } from './usePauseRunOnUnmount';
import { ALL_OPTIONS_ON } from '@/texts/normalize';

const config = { mode: 'free' as const, language: 'fr' as const, textId: 'fr-001', options: ALL_OPTIONS_ON };

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  useRunStore.getState().reset();
});

describe('usePauseRunOnUnmount', () => {
  it('met en pause une run en cours au démontage de la page', () => {
    useRunStore.getState().start(config, 'ab');
    useRunStore.getState().key('a'); // démarre le chrono
    const { unmount } = renderHook(() => usePauseRunOnUnmount());
    expect(useRunStore.getState().status).toBe('running');
    unmount();
    expect(useRunStore.getState().status).toBe('paused');
  });

  it('ne fait rien sans run en cours', () => {
    const { unmount } = renderHook(() => usePauseRunOnUnmount());
    unmount();
    expect(useRunStore.getState().status).toBe('idle');
  });
});
