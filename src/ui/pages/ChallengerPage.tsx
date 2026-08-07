import { useCallback, useEffect, useState } from 'react';
import { useRunStore } from '@/state/runStore';
import { useToasts } from '@/state/toastStore';
import { useSettings } from '@/state/settingsStore';
import { useFocusGuard } from '@/ui/hooks/useFocusGuard';
import { usePauseRunOnUnmount } from '@/ui/hooks/usePauseRunOnUnmount';
import { TypingArea } from '@/ui/components/TypingArea';
import { RunHud } from '@/ui/components/RunHud';
import { ResultsScreen } from '@/ui/components/ResultsScreen';
import { TierBadge, tierLabel } from '@/ui/components/TierBadge';
import { playError, playKey, playSuccess } from '@/ui/sounds';
import { getOfficialTexts } from '@/texts/corpus';
import { ALL_OPTIONS_ON, applyOptions } from '@/texts/normalize';
import { getProgress } from '@/db/challengerRepo';
import type { ChallengerProgress } from '@/db/types';
import { nextTier, TIER_THRESHOLDS } from '@/scoring/league';
import { isCodeLanguage, LANGUAGE_LABELS, type Language } from '@/texts/types';

const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

function LeagueCard({ progress }: { progress: ChallengerProgress }) {
  const next = nextTier(progress.tier);
  const base = progress.tier ? TIER_THRESHOLDS[progress.tier] : 0;
  const pct = next ? Math.min(100, Math.round(((progress.total - base) / (next.threshold - base)) * 100)) : 100;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-6 backdrop-blur">
      <div className="flex items-center justify-between">
        {progress.tier ? <TierBadge tier={progress.tier} /> : (
          <span className="rounded-full border border-line px-3 py-0.5 text-xs font-bold uppercase text-muted">
            Non classé
          </span>
        )}
        <p className="font-type text-3xl font-extrabold">{progress.total} <span className="text-sm text-muted">pts</span></p>
      </div>
      {next && (
        <div>
          <div className="h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted">
            {progress.total} / {next.threshold} pts pour {tierLabel(next.tier)}
          </p>
        </div>
      )}
      {progress.tierHistory.length > 0 && (
        <ul className="flex flex-col gap-1 border-t border-line pt-2 text-xs text-muted">
          {progress.tierHistory.map((h) => (
            <li key={h.at}>
              {tierLabel(h.tier)} atteint le {dateFmt.format(h.at)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ChallengerPage() {
  const { status, typing, result, start, key, backspace, reset } = useRunStore();
  const profile = useSettings((s) => s.profile);
  const push = useToasts((s) => s.push);
  const [language, setLanguage] = useState<Language>(profile.defaultLanguage);
  const [progress, setProgress] = useState<ChallengerProgress | null>(null);
  useFocusGuard();
  usePauseRunOnUnmount();

  useEffect(() => {
    setLanguage(profile.defaultLanguage);
  }, [profile.defaultLanguage]);

  const refresh = useCallback(() => {
    let active = true;
    void getProgress(language)
      .then((p) => {
        if (active) setProgress(p);
      })
      .catch(() => { /* IndexedDB indisponible : progression masquée */ });
    return () => {
      active = false;
    };
  }, [language]);
  useEffect(() => {
    const cancel = refresh();
    return cancel;
  }, [refresh]);

  useEffect(() => {
    if (!result) return;
    refresh();
    result.newAchievements.forEach((a) =>
      push({ title: a.title, description: a.description, kind: 'achievement' }),
    );
    if (result.tierUp) {
      push({ title: `Nouveau tier : ${tierLabel(result.tierUp)}`, kind: 'info' });
      playSuccess();
    }
  }, [result, refresh, push]);

  const play = (textId: string) => {
    const entry = getOfficialTexts(language).find((t) => t.id === textId);
    if (!entry) return;
    // code toujours brut (applyOptions détruirait les sauts de ligne)
    const text = isCodeLanguage(language) ? entry.text : applyOptions(entry.text, ALL_OPTIONS_ON);
    start({ mode: 'challenger', language, textId, options: ALL_OPTIONS_ON }, text);
  };

  const handleChar = (c: string) => {
    const t = useRunStore.getState().typing;
    if (t && profile.sounds) {
      if (t.text[t.cursor] === c) playKey();
      else playError();
    }
    key(c);
  };

  if (status === 'finished' && result) {
    return <ResultsScreen result={result} onReplay={() => result.run && play(result.run.textId)} onExit={reset} />;
  }

  if (status === 'finished') {
    return null; // résultat en cours de calcul
  }

  if (status === 'running' || status === 'paused' || status === 'invalidated') {
    return (
      <div className="flex flex-col gap-6">
        {typing && <RunHud typing={typing} />}
        {status === 'invalidated' ? (
          <div className="rounded-xl border border-err/40 bg-err/10 p-6 text-center">
            <p className="mb-4 font-bold text-err">Run classée invalidée : perte de focus trop longue.</p>
            <button type="button" onClick={reset} className="rounded-xl bg-accent px-6 py-2 font-bold text-white">
              Retour à la ligue
            </button>
          </div>
        ) : (
          typing && (
            <>
              {status === 'paused' && (
                <p className="text-center text-sm text-muted">En pause — clique dans le texte pour reprendre.</p>
              )}
              <TypingArea state={typing} disabled={status !== 'running'} onChar={handleChar} onBackspace={backspace} />
            </>
          )
        )}
      </div>
    );
  }

  const texts = getOfficialTexts(language);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mode Challenger</h1>
        <div className="flex gap-2">
          {(['fr', 'en', 'c', 'python'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLanguage(l)}
              className={`rounded-xl border px-4 py-1.5 font-bold transition-colors ${
                language === l ? 'border-accent bg-accent/15 text-text' : 'border-line text-muted'
              }`}
            >
              {LANGUAGE_LABELS[l]}
            </button>
          ))}
        </div>
      </div>

      {progress && <LeagueCard progress={progress} />}

      <ul className="flex flex-col gap-2">
        {texts.map((t, i) => (
          <li
            key={t.id}
            className="flex items-center gap-4 rounded-xl border border-line bg-surface px-4 py-3 backdrop-blur"
          >
            <span className="w-6 text-center font-type font-bold text-muted">{i + 1}</span>
            <p className="flex-1 truncate text-sm text-muted">{t.text.slice(0, 80)}…</p>
            <span className="w-20 text-right font-type font-bold">
              {progress?.bestByText[t.id] ?? 0} <span className="text-xs text-muted">pts</span>
            </span>
            <button
              type="button"
              onClick={() => play(t.id)}
              className="rounded-lg bg-accent px-4 py-1.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Jouer
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
