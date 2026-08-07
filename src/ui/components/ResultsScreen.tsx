import { motion } from 'framer-motion';
import type { RecordKind, RunResult } from '@/game/runFlow';
import { Sparkline } from './Sparkline';
import { TierBadge } from './TierBadge';
import type { AchievementDef } from '@/achievements/definitions';

const RECORD_LABELS: Record<RecordKind, string> = {
  wpm: 'Nouveau record de WPM !',
  accuracy: 'Nouvelle meilleure précision !',
  longest: 'Ta plus longue run !',
};

interface ResultsScreenProps {
  result: RunResult;
  onReplay: () => void;
  onExit: () => void;
}

export function ResultsScreen({ result, onReplay, onExit }: ResultsScreenProps) {
  const { run } = result;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-8 backdrop-blur"
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">WPM</p>
          <p className="font-type text-4xl font-extrabold text-accent">{run.wpm.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Précision</p>
          <p className="font-type text-4xl font-extrabold">{(run.accuracy * 100).toFixed(1)} %</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Temps</p>
          <p className="font-type text-4xl font-extrabold">{(run.durationMs / 1000).toFixed(1)} s</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Points</p>
          <p className="font-type text-4xl font-extrabold">{run.points}</p>
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-muted">WPM par seconde</p>
        <Sparkline data={result.timeline} width={560} height={64} />
      </div>

      {result.newRecords.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {result.newRecords.map((r) => (
            <li key={r} className="rounded-full border border-ok/40 bg-ok/10 px-3 py-1 text-sm text-ok">
              {RECORD_LABELS[r]}
            </li>
          ))}
        </ul>
      )}

      {result.tierUp && (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4"
        >
          <span className="font-bold">Nouveau tier atteint :</span>
          <TierBadge tier={result.tierUp} />
        </motion.div>
      )}

      {result.newAchievements.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-muted">Succès débloqués</p>
          <ul className="flex flex-wrap gap-2">
            {result.newAchievements.map((a: AchievementDef) => (
              <li key={a.id} className="rounded-full border border-line bg-bg px-3 py-1 text-sm">
                {a.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onReplay}
          className="rounded-xl bg-accent-strong px-6 py-2 font-bold text-white transition-opacity hover:opacity-90"
        >
          Rejouer
        </button>
        <button
          type="button"
          onClick={onExit}
          className="rounded-xl border border-line px-6 py-2 text-muted transition-colors hover:text-text"
        >
          Retour
        </button>
      </div>
    </motion.div>
  );
}
