import { useEffect, useRef } from 'react';
import { useRunStore } from '@/state/runStore';
import { useSettings } from '@/state/settingsStore';
import { nowMs } from '@/engine/clock';

/** Pauses on window blur; invalidates the run if focus doesn't return within `focusTimeoutSec`. */
export function useFocusGuard(): void {
  const status = useRunStore((s) => s.status);
  const timeoutSec = useSettings((s) => s.profile.focusTimeoutSec);
  // The timer lives in a ref: the effect re-runs on every status change
  // (running → paused on blur) and must not cancel the timer already in flight.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status !== 'running' && status !== 'paused') return;
    const { pause, resume, invalidate } = useRunStore.getState();
    const onBlur = () => {
      if (useRunStore.getState().status !== 'running') return;
      pause();
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(invalidate, timeoutSec * 1000);
    };
    const onFocus = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      // timers are throttled when the tab is hidden: the invalidation
      // setTimeout may not have fired. We decide based on the monotonic
      // clock from the start of the pause (same origin as pauseStartedAt).
      const pausedAt = useRunStore.getState().typing?.pauseStartedAt;
      if (pausedAt != null && nowMs() - pausedAt > timeoutSec * 1000) invalidate();
      else resume();
    };
    // mobile: lock/app-switch emits visibilitychange without a reliable blur
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') onBlur();
      else onFocus();
    };
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [status, timeoutSec]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );
}
