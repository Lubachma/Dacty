import { useEffect } from 'react';
import { useRunStore } from '@/state/runStore';

/**
 * Met la run en pause quand on quitte la page : le chrono ne tourne pas pendant la
 * navigation (le temps de pause est exclu par pausedMs). pause() est un no-op si la
 * run n'est pas en cours.
 */
export function usePauseRunOnUnmount(): void {
  useEffect(
    () => () => {
      useRunStore.getState().pause();
    },
    [],
  );
}
