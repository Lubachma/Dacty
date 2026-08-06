import { useEffect, useRef } from 'react';
import { useRunStore } from '@/state/runStore';
import { useSettings } from '@/state/settingsStore';
import { nowMs } from '@/engine/clock';

/** Pause au blur de la fenêtre ; invalide la run si le focus ne revient pas sous `focusTimeoutSec`. */
export function useFocusGuard(): void {
  const status = useRunStore((s) => s.status);
  const timeoutSec = useSettings((s) => s.profile.focusTimeoutSec);
  // Le timer vit dans une ref : l'effet se relance à chaque changement de statut
  // (running → paused au blur) et ne doit pas annuler le timer en cours.
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
      // les timers sont throttlés quand l'onglet est caché : le setTimeout
      // d'invalidation peut ne pas avoir tourné. On tranche depuis l'horloge
      // monotone du début de pause (même origine que pauseStartedAt).
      const pausedAt = useRunStore.getState().typing?.pauseStartedAt;
      if (pausedAt != null && nowMs() - pausedAt > timeoutSec * 1000) invalidate();
      else resume();
    };
    // mobile : verrouillage/bascule d'app émet visibilitychange sans blur fiable
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
