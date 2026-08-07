import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { recentRuns } from '@/db/runsRepo';
import { getProgress } from '@/db/challengerRepo';
import type { ChallengerProgress, RunRecord } from '@/db/types';
import { TierBadge } from '@/ui/components/TierBadge';
import { useSettings } from '@/state/settingsStore';
import type { Language } from '@/texts/types';

const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

function LeagueMini({ label, progress }: { label: string; progress: ChallengerProgress | null }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 backdrop-blur">
      <span className="font-semibold">{label}</span>
      {progress?.tier ? <TierBadge tier={progress.tier} /> : (
        <span className="text-sm text-muted">Non classé</span>
      )}
      <span className="font-type font-bold">{progress?.total ?? 0} pts</span>
    </div>
  );
}

export function HomePage() {
  const pseudo = useSettings((s) => s.profile.pseudo);
  const [progress, setProgress] = useState<Record<Language, ChallengerProgress | null>>({
    fr: null, en: null, c: null, python: null,
  });
  const [recent, setRecent] = useState<RunRecord[]>([]);

  useEffect(() => {
    for (const lang of ['fr', 'en', 'c', 'python'] as const) {
      void getProgress(lang)
        .then((p) => setProgress((s) => ({ ...s, [lang]: p })))
        .catch(() => { /* IndexedDB indisponible : progression masquée */ });
    }
    void recentRuns(5)
      .then(setRecent)
      .catch(() => { /* IndexedDB indisponible : liste vide déjà gérée */ });
  }, []);

  return (
    <div className="flex flex-col gap-10">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 py-10 text-center"
      >
        <h1 className="text-5xl font-extrabold tracking-tight">
          <span className="text-accent">Dacty</span>
        </h1>
        <p className="max-w-md text-lg text-muted">
          Le speedrun dactylo. Tape des textes le plus vite possible, grimpe la ligue, débloque les succès.
        </p>
        <div className="flex gap-3">
          <Link
            to="/play"
            className="rounded-xl bg-accent-strong px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
          >
            Entraînement libre
          </Link>
          <Link
            to="/challenger"
            className="rounded-xl border border-line px-6 py-3 font-bold transition-colors hover:bg-surface"
          >
            Mode Challenger
          </Link>
        </div>
        <p className="text-sm text-muted">Bienvenue, {pseudo}.</p>
      </motion.section>

      <section className="grid gap-3 sm:grid-cols-2">
        <LeagueMini label="Ligue française" progress={progress.fr} />
        <LeagueMini label="Ligue anglaise" progress={progress.en} />
        <LeagueMini label="Ligue C" progress={progress.c} />
        <LeagueMini label="Ligue Python" progress={progress.python} />
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Dernières runs</h2>
          <ul className="flex flex-col gap-2">
            {recent.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-4 rounded-xl border border-line bg-surface px-4 py-2 text-sm backdrop-blur"
              >
                <span className="font-type font-bold">{r.wpm.toFixed(1)} WPM</span>
                <span className="text-muted">{Math.round(r.accuracy * 100)} %</span>
                <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">
                  {r.mode === 'free' ? 'Libre' : 'Challenger'} · {r.language.toUpperCase()}
                </span>
                <span className="ml-auto text-xs text-muted">{dateFmt.format(r.date)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
