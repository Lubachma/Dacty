import { useEffect } from 'react';
import { useRunStore } from '@/state/runStore';

/**
 * Pauses the run when leaving the page: the clock doesn't run during
 * navigation (the paused time is excluded via pausedMs). pause() is a no-op if
 * the run isn't in progress.
 */
export function usePauseRunOnUnmount(): void {
  useEffect(
    () => () => {
      useRunStore.getState().pause();
    },
    [],
  );
}
