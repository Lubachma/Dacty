import { useEffect, useRef } from 'react';
import { useRunStore } from '@/state/runStore';
import { useSettings } from '@/state/settingsStore';

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
      pause();
      timerRef.current = setTimeout(invalidate, timeoutSec * 1000);
    };
    const onFocus = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      resume();
    };
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, [status, timeoutSec]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );
}
