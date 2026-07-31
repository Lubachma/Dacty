import 'fake-indexeddb/auto';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db/db';
import { useRunStore } from '@/state/runStore';
import { useSettings } from '@/state/settingsStore';
import { useFocusGuard } from './useFocusGuard';
import { ALL_OPTIONS_ON } from '@/texts/normalize';

const config = { mode: 'free' as const, language: 'fr' as const, textId: 'fr-001', options: ALL_OPTIONS_ON };

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  useRunStore.getState().reset();
  useSettings.setState((s) => ({ profile: { ...s.profile, focusTimeoutSec: 5 } }));
});

describe('useFocusGuard', () => {
  it('met en pause au blur, reprend au focus, invalide après le délai', () => {
    vi.useFakeTimers();
    useRunStore.getState().start(config, 'ab');
    useRunStore.getState().key('a'); // démarre le chrono
    renderHook(() => useFocusGuard());

    act(() => { window.dispatchEvent(new Event('blur')); });
    expect(useRunStore.getState().status).toBe('paused');

    act(() => { window.dispatchEvent(new Event('focus')); });
    expect(useRunStore.getState().status).toBe('running');

    act(() => { window.dispatchEvent(new Event('blur')); });
    act(() => { vi.advanceTimersByTime(5100); });
    expect(useRunStore.getState().status).toBe('invalidated');
    vi.useRealTimers();
  });
});
