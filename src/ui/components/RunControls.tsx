import { useRunStore } from '@/state/runStore';
import { useT } from '@/i18n';

/**
 * Actions during a training run:
 * "Restart" replays the same text from scratch, "Stop" abandons it (nothing is
 * saved). Renders null outside a run — the parent only shows it during the run.
 */
export function RunControls() {
  const t = useT();
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
        {t('run.restart')}
      </button>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg border border-line px-4 py-1.5 text-sm font-bold transition-colors hover:border-accent"
      >
        {t('run.stop')}
      </button>
    </div>
  );
}
