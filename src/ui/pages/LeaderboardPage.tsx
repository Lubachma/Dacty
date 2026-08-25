import { useEffect, useState } from 'react';
import { personalBests, rankFor, topRuns } from '@/db/runsRepo';
import type { GameMode, RunRecord } from '@/db/types';
import { useDateFormatter, useT } from '@/i18n';
import { getOfficialTexts, getTexts } from '@/texts/corpus';
import { LANGUAGE_LABELS, type Language } from '@/texts/types';

function BestCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 backdrop-blur">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="font-type text-2xl font-extrabold">{value}</p>
      <p className="text-xs text-muted">{sub}</p>
    </div>
  );
}

export function LeaderboardPage() {
  const t = useT();
  const dateFmt = useDateFormatter({ dateStyle: 'short', timeStyle: 'short' });
  const [mode, setMode] = useState<GameMode>('free');
  const [language, setLanguage] = useState<Language>('fr');
  const [textId, setTextId] = useState('');
  const [rows, setRows] = useState<RunRecord[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [bests, setBests] = useState<Awaited<ReturnType<typeof personalBests>> | null>(null);

  const textChoices = mode === 'challenger' ? getOfficialTexts(language) : getTexts(language);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const list = await topRuns({ mode, language, textId: textId || undefined });
        const b = await personalBests();
        if (!active) return;
        setRows(list);
        setBests(b);
        if (textId) {
          const all = await topRuns({ mode, language, textId }, 1000);
          if (!active) return;
          const best = mode === 'challenger'
            ? Math.max(0, ...all.map((r) => r.points))
            : Math.max(0, ...all.map((r) => r.wpm));
          setMyRank(await rankFor({ mode, language, textId }, best));
        } else {
          setMyRank(null);
        }
      } catch {
        // IndexedDB unavailable: empty lists already handled
      }
    })();
    return () => {
      active = false;
    };
  }, [mode, language, textId]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('leaderboard.title')}</h1>

      {bests && (
        <div className="grid grid-cols-3 gap-3">
          <BestCard
            label={t('leaderboard.bestWpm')}
            value={bests.bestWpm ? `${bests.bestWpm.wpm.toFixed(1)} WPM` : '—'}
            sub={bests.bestWpm ? dateFmt.format(bests.bestWpm.date) : t('leaderboard.noRun')}
          />
          <BestCard
            label={t('leaderboard.bestAccuracy')}
            value={bests.bestAccuracy ? `${(bests.bestAccuracy.accuracy * 100).toFixed(1)}${t('unit.percent')}` : '—'}
            sub={bests.bestAccuracy ? dateFmt.format(bests.bestAccuracy.date) : t('leaderboard.minDuration')}
          />
          <BestCard
            label={t('leaderboard.longestRun')}
            value={bests.longestRun ? `${bests.longestRun.chars}${t('unit.chars')}` : '—'}
            sub={bests.longestRun ? dateFmt.format(bests.longestRun.date) : t('leaderboard.noRun')}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(['free', 'challenger'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setTextId(''); }}
            className={`rounded-xl border px-4 py-1.5 font-bold transition-colors ${
              mode === m ? 'border-accent bg-accent/15 text-text' : 'border-line text-muted'
            }`}
          >
            {m === 'free' ? t('leaderboard.mode.free') : t('leaderboard.mode.challenger')}
          </button>
        ))}
        {(['fr', 'en', 'c', 'python'] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => { setLanguage(l); setTextId(''); }}
            className={`rounded-xl border px-4 py-1.5 font-bold transition-colors ${
              language === l ? 'border-accent bg-accent/15 text-text' : 'border-line text-muted'
            }`}
          >
            {LANGUAGE_LABELS[l]}
          </button>
        ))}
        <select
          aria-label={t('leaderboard.textAria')}
          value={textId}
          onChange={(e) => setTextId(e.target.value)}
          className="rounded-xl border border-line bg-bg px-3 py-1.5 text-sm"
        >
          <option value="">{t('leaderboard.allTexts')}</option>
          {textChoices.map((t) => (
            <option key={t.id} value={t.id}>{t.id} — {t.text.slice(0, 40)}…</option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-6 text-center text-muted">
          {t('leaderboard.empty')}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2">{t('leaderboard.col.rank')}</th>
                <th className="px-4 py-2">WPM</th>
                <th className="px-4 py-2">{t('leaderboard.col.accuracy')}</th>
                <th className="px-4 py-2">{t('leaderboard.col.points')}</th>
                <th className="px-4 py-2">{t('leaderboard.col.time')}</th>
                <th className="px-4 py-2">{t('leaderboard.col.text')}</th>
                <th className="px-4 py-2">{t('leaderboard.col.date')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-4 py-2 font-type font-bold">{i + 1}</td>
                  <td className="px-4 py-2 font-type">{r.wpm.toFixed(1)}</td>
                  <td className="px-4 py-2">{Math.round(r.accuracy * 100)}{t('unit.percent')}</td>
                  <td className="px-4 py-2 font-type">{r.points}</td>
                  <td className="px-4 py-2">{(r.durationMs / 1000).toFixed(1)} s</td>
                  <td className="px-4 py-2 text-muted">{r.textId}</td>
                  <td className="px-4 py-2 text-muted">{dateFmt.format(r.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {myRank !== null && myRank > 10 && (
        <p className="text-sm text-muted">{t('leaderboard.myRank', { rank: myRank })}</p>
      )}
    </div>
  );
}
