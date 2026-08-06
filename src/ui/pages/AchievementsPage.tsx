import { useEffect, useState } from 'react';
import {
  ACHIEVEMENTS, type AchievementCategory, type AchievementContext, type AchievementDef,
} from '@/achievements/definitions';
import { computeStreak } from '@/achievements/check';
import { db } from '@/db/db';
import { allRuns } from '@/db/runsRepo';
import { getProgress } from '@/db/challengerRepo';
import type { RunRecord } from '@/db/types';

const CATEGORIES: { id: AchievementCategory; label: string }[] = [
  { id: 'vitesse', label: 'Vitesse' },
  { id: 'precision', label: 'Précision' },
  { id: 'volume', label: 'Volume' },
  { id: 'challenger', label: 'Challenger' },
  { id: 'dev', label: 'Dev' },
  { id: 'fun', label: 'Fun' },
];

const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

const SYNTHETIC_RUN: RunRecord = {
  date: 0, mode: 'free', language: 'fr', textId: '',
  options: { punctuation: true, specialChars: true, digits: true, accents: true },
  durationMs: 0, wpm: 0, accuracy: 1, points: 0, errors: 0, backspaces: 0, chars: 0, noBackspace: false,
};

function AchievementCard({ def, unlockedAt, ctx }: {
  def: AchievementDef;
  unlockedAt: number | null;
  ctx: AchievementContext;
}) {
  const progress = !unlockedAt && def.target && def.progress ? def.progress(ctx) : null;
  const pct = progress !== null && def.target ? Math.min(100, Math.round((progress / def.target) * 100)) : null;
  return (
    <li
      className={`rounded-xl border p-4 backdrop-blur ${
        unlockedAt ? 'border-accent/50 bg-accent/10' : 'border-line bg-surface opacity-80'
      }`}
    >
      <p className="font-bold">{def.title}</p>
      <p className="text-sm text-muted">{def.description}</p>
      {unlockedAt ? (
        <p className="mt-2 text-xs text-accent">Débloqué le {dateFmt.format(unlockedAt)}</p>
      ) : (
        progress !== null && def.target && (
          <div className="mt-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted">{progress} / {def.target}</p>
          </div>
        )
      )}
    </li>
  );
}

export function AchievementsPage() {
  const [ctx, setCtx] = useState<AchievementContext | null>(null);
  const [unlocked, setUnlocked] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    void (async () => {
      try {
        const [runs, unlocks, fr, en, c, python] = await Promise.all([
          allRuns(), db.achievements.toArray(),
          getProgress('fr'), getProgress('en'), getProgress('c'), getProgress('python'),
        ]);
        setUnlocked(new Map(unlocks.map((u) => [u.id, u.unlockedAt])));
        const sorted = runs.slice().sort((a, b) => a.date - b.date);
        setCtx({
          newRun: sorted[sorted.length - 1] ?? SYNTHETIC_RUN,
          runs,
          totalChars: runs.reduce((s, r) => s + r.chars, 0),
          streakDays: computeStreak(runs.map((r) => r.date), Date.now()),
          progress: { fr, en, c, python },
          now: Date.now(),
        });
      } catch {
        // IndexedDB indisponible : la page reste à 0 / N
      }
    })();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-baseline gap-4">
        <h1 className="text-2xl font-bold">Succès</h1>
        <p className="font-type text-lg text-muted">{unlocked.size} / {ACHIEVEMENTS.length}</p>
      </div>
      {CATEGORIES.map(({ id, label }) => (
        <section key={id}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{label}</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ACHIEVEMENTS.filter((a) => a.category === id).map((a) => (
              ctx && (
                <AchievementCard
                  key={a.id}
                  def={a}
                  unlockedAt={unlocked.get(a.id) ?? null}
                  ctx={ctx}
                />
              )
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
