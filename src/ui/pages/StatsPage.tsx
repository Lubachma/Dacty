import { useEffect, useState } from 'react';
import { allRuns } from '@/db/runsRepo';
import type { RunRecord } from '@/db/types';
import { computeStreak } from '@/achievements/check';
import { Sparkline } from '@/ui/components/Sparkline';
import { dailyAverages } from './statsUtils';

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 backdrop-blur">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="font-type text-2xl font-extrabold">{value}</p>
    </div>
  );
}

export function StatsPage() {
  const [runs, setRuns] = useState<RunRecord[] | null>(null);
  useEffect(() => {
    // IndexedDB indisponible : tableau vide → états « aucune donnée » déjà prévus
    void allRuns().then(setRuns).catch(() => setRuns([]));
  }, []);

  if (!runs) return null;
  const totalChars = runs.reduce((s, r) => s + r.chars, 0);
  const mean = (f: (r: RunRecord) => number) =>
    runs.length === 0 ? 0 : runs.reduce((s, r) => s + f(r), 0) / runs.length;
  const streak = computeStreak(runs.map((r) => r.date), Date.now());
  const daily = dailyAverages(runs, 30);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Statistiques</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card label="Runs" value={String(runs.length)} />
        <Card label="Caractères" value={totalChars.toLocaleString('fr-FR')} />
        <Card label="WPM moyen" value={mean((r) => r.wpm).toFixed(1)} />
        <Card label="Précision moyenne" value={`${(mean((r) => r.accuracy) * 100).toFixed(1)} %`} />
        <Card label="Série" value={`${streak} j`} />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
          WPM moyen — 30 derniers jours
        </h2>
        <div className="rounded-xl border border-line bg-surface p-4 backdrop-blur">
          <Sparkline data={daily.map((d) => d.avgWpm)} width={760} height={80} />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
          Précision moyenne — 30 derniers jours
        </h2>
        <div className="rounded-xl border border-line bg-surface p-4 backdrop-blur">
          <Sparkline data={daily.map((d) => d.avgAccuracy * 100)} width={760} height={80} />
        </div>
      </section>
    </div>
  );
}
