import { useEffect, useState } from 'react';
import { allRuns } from '@/db/runsRepo';
import type { RunRecord } from '@/db/types';
import { computeStreak } from '@/achievements/check';
import { Sparkline } from '@/ui/components/Sparkline';
import { localeFor, useT, useUiLanguage } from '@/i18n';
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
  const t = useT();
  const lang = useUiLanguage();
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
      <h1 className="text-2xl font-bold">{t('stats.title')}</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card label={t('stats.runs')} value={String(runs.length)} />
        <Card label={t('stats.chars')} value={totalChars.toLocaleString(localeFor(lang))} />
        <Card label={t('stats.avgWpm')} value={mean((r) => r.wpm).toFixed(1)} />
        <Card label={t('stats.avgAccuracy')} value={`${(mean((r) => r.accuracy) * 100).toFixed(1)}${t('unit.percent')}`} />
        <Card label={t('stats.streak')} value={`${streak}${t('unit.day')}`} />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
          {t('stats.avgWpm30')}
        </h2>
        <div className="rounded-xl border border-line bg-surface p-4 backdrop-blur">
          <Sparkline data={daily.map((d) => d.avgWpm)} width={760} height={80} label={t('stats.wpmAria')} />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
          {t('stats.avgAccuracy30')}
        </h2>
        <div className="rounded-xl border border-line bg-surface p-4 backdrop-blur">
          <Sparkline data={daily.map((d) => d.avgAccuracy * 100)} width={760} height={80} label={t('stats.accuracyAria')} />
        </div>
      </section>
    </div>
  );
}
