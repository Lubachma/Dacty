import { useRunStore } from '@/state/runStore';

/**
 * Actions pendant une run d'entraînement :
 * « Recommencer » relance le même texte à zéro, « Arrêter » abandonne (rien n'est
 * enregistré). Rend null hors run — le parent ne l'affiche que pendant la run.
 */
export function RunControls() {
  const config = useRunStore((s) => s.config);
  const text = useRunStore((s) => s.typing?.text);
  const start = useRunStore((s) => s.start);
  const reset = useRunStore((s) => s.reset);
  if (!config || !text) return null;
  return (
    <div className="flex justify-center gap-3">
      <button
        type="button"
        onClick={() => start(config, text)}
        className="rounded-lg border border-line px-4 py-1.5 text-sm font-bold transition-colors hover:border-accent"
      >
        Recommencer
      </button>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg border border-line px-4 py-1.5 text-sm font-bold transition-colors hover:border-accent"
      >
        Arrêter
      </button>
    </div>
  );
}
