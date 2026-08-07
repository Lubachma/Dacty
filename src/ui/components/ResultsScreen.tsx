import { motion } from 'framer-motion';
import type { RecordKind, RunResult } from '@/game/runFlow';
import { pick, useT, useUiLanguage } from '@/i18n';
import type { TranslationKey } from '@/i18n/fr';
import { Sparkline } from './Sparkline';
import { TierBadge } from './TierBadge';
import type { AchievementDef } from '@/achievements/definitions';

const RECORD_KEYS: Record<RecordKind, TranslationKey> = {
  wpm: 'results.record.wpm',
  accuracy: 'results.record.accuracy',
  longest: 'results.record.longest',
};

interface ResultsScreenProps {
  result: RunResult;
  onReplay: () => void;
  onExit: () => void;
}

export function ResultsScreen({ result, onReplay, onExit }: ResultsScreenProps) {
  const lang = useUiLanguage();
  const t = useT();
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
          <p className="text-xs uppercase tracking-wide text-muted">{t('results.accuracy')}</p>
          <p className="font-type text-4xl font-extrabold">{(run.accuracy * 100).toFixed(1)}{t('unit.percent')}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">{t('results.time')}</p>
          <p className="font-type text-4xl font-extrabold">{(run.durationMs / 1000).toFixed(1)} s</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">{t('results.points')}</p>
          <p className="font-type text-4xl font-extrabold">{run.points}</p>
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-muted">{t('results.wpmPerSecond')}</p>
        <Sparkline data={result.timeline} width={560} height={64} label={t('results.sparklineAria')} />
      </div>

      {result.newRecords.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {result.newRecords.map((r) => (
            <li key={r} className="rounded-full border border-ok/40 bg-ok/10 px-3 py-1 text-sm text-ok">
              {t(RECORD_KEYS[r])}
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
          <span className="font-bold">{t('results.tierUp')}</span>
          <TierBadge tier={result.tierUp} />
        </motion.div>
      )}

      {result.newAchievements.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-muted">{t('results.achievements')}</p>
          <ul className="flex flex-wrap gap-2">
            {result.newAchievements.map((a: AchievementDef) => (
              <li key={a.id} className="rounded-full border border-line bg-bg px-3 py-1 text-sm">
                {pick(a.title, lang)}
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
          {t('results.replay')}
        </button>
        <button
          type="button"
          onClick={onExit}
          className="rounded-xl border border-line px-6 py-2 text-muted transition-colors hover:text-text"
        >
          {t('results.back')}
        </button>
      </div>
    </motion.div>
  );
}
