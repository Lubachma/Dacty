import { useEffect, useState } from 'react';
import { personalBests, rankFor, topRuns } from '@/db/runsRepo';
import type { GameMode, RunRecord } from '@/db/types';
import { getOfficialTexts, getTexts } from '@/texts/corpus';
import { LANGUAGE_LABELS, type Language } from '@/texts/types';

const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

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
        // IndexedDB indisponible : listes vides déjà gérées
      }
    })();
    return () => {
      active = false;
    };
  }, [mode, language, textId]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Classements</h1>

      {bests && (
        <div className="grid grid-cols-3 gap-3">
          <BestCard
            label="Meilleur WPM"
            value={bests.bestWpm ? `${bests.bestWpm.wpm.toFixed(1)} WPM` : '—'}
            sub={bests.bestWpm ? dateFmt.format(bests.bestWpm.date) : 'aucune run'}
          />
          <BestCard
            label="Meilleure précision"
            value={bests.bestAccuracy ? `${(bests.bestAccuracy.accuracy * 100).toFixed(1)} %` : '—'}
            sub={bests.bestAccuracy ? dateFmt.format(bests.bestAccuracy.date) : 'runs ≥ 10 s'}
          />
          <BestCard
            label="Plus longue run"
            value={bests.longestRun ? `${bests.longestRun.chars} car.` : '—'}
            sub={bests.longestRun ? dateFmt.format(bests.longestRun.date) : 'aucune run'}
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
            {m === 'free' ? 'Libre' : 'Challenger'}
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
          aria-label="Texte"
          value={textId}
          onChange={(e) => setTextId(e.target.value)}
          className="rounded-xl border border-line bg-bg px-3 py-1.5 text-sm"
        >
          <option value="">Tous les textes</option>
          {textChoices.map((t) => (
            <option key={t.id} value={t.id}>{t.id} — {t.text.slice(0, 40)}…</option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-6 text-center text-muted">
          Aucune run enregistrée pour ces filtres. À toi de jouer !
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2">Rang</th>
                <th className="px-4 py-2">WPM</th>
                <th className="px-4 py-2">Précision</th>
                <th className="px-4 py-2">Points</th>
                <th className="px-4 py-2">Temps</th>
                <th className="px-4 py-2">Texte</th>
                <th className="px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-4 py-2 font-type font-bold">{i + 1}</td>
                  <td className="px-4 py-2 font-type">{r.wpm.toFixed(1)}</td>
                  <td className="px-4 py-2">{Math.round(r.accuracy * 100)} %</td>
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
        <p className="text-sm text-muted">Ta meilleure run sur ce texte : rang {myRank}.</p>
      )}
    </div>
  );
}
