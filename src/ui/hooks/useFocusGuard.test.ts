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
    useRunStore.getState().key('a'); // starts the clock
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

  it("invalide au retour de focus si l'absence a dépassé le délai (timer throttlé en arrière-plan)", () => {
    vi.useFakeTimers();
    useRunStore.getState().start(config, 'ab');
    useRunStore.getState().key('a');
    renderHook(() => useFocusGuard());

    act(() => { window.dispatchEvent(new Event('blur')); });
    expect(useRunStore.getState().status).toBe('paused');

    // hidden tab: the invalidation setTimeout hasn't fired (throttled),
    // but the monotonic clock has advanced past the deadline
    const shifted = performance.now() + 10_000;
    const clock = vi.spyOn(performance, 'now').mockReturnValue(shifted);
    act(() => { window.dispatchEvent(new Event('focus')); });
    expect(useRunStore.getState().status).toBe('invalidated');
    clock.mockRestore();
    vi.useRealTimers();
  });

  it("met en pause quand l'onglet devient caché (visibilitychange)", () => {
    useRunStore.getState().start(config, 'ab');
    useRunStore.getState().key('a');
    renderHook(() => { useFocusGuard(); });

    const original = Object.getOwnPropertyDescriptor(document, 'visibilityState');
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(useRunStore.getState().status).toBe('paused');
    if (original) Object.defineProperty(document, 'visibilityState', original);
  });
});
