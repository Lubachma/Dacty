import { useEffect, useState } from 'react';
import { useRunStore } from '@/state/runStore';
import { useSettings } from '@/state/settingsStore';
import { useToasts } from '@/state/toastStore';
import { useFocusGuard } from '@/ui/hooks/useFocusGuard';
import { TypingArea } from '@/ui/components/TypingArea';
import { RunHud } from '@/ui/components/RunHud';
import { ResultsScreen } from '@/ui/components/ResultsScreen';
import { Toggle } from '@/ui/components/Toggle';
import { playError, playKey, playSuccess } from '@/ui/sounds';
import { pickText } from '@/texts/corpus';
import { ALL_OPTIONS_ON, applyOptions } from '@/texts/normalize';
import type { Language, TextLength, TextOptions } from '@/texts/types';

const LENGTHS: { value: TextLength | 'quote'; label: string }[] = [
  { value: 'short', label: 'Court' },
  { value: 'medium', label: 'Moyen' },
  { value: 'long', label: 'Long' },
  { value: 'quote', label: 'Citation' },
];

const TOGGLES: { key: keyof TextOptions; label: string }[] = [
  { key: 'punctuation', label: 'Ponctuation' },
  { key: 'specialChars', label: 'Caractères spéciaux' },
  { key: 'digits', label: 'Chiffres' },
  { key: 'accents', label: 'Accents' },
];

export function PlayPage() {
  const { status, typing, result, start, key, backspace, reset } = useRunStore();
  const profile = useSettings((s) => s.profile);
  const push = useToasts((s) => s.push);
  const [language, setLanguage] = useState<Language>(profile.defaultLanguage);
  const [length, setLength] = useState<TextLength | 'quote'>('short');
  const [options, setOptions] = useState<TextOptions>(ALL_OPTIONS_ON);
  useFocusGuard();

  useEffect(() => {
    setLanguage(profile.defaultLanguage);
  }, [profile.defaultLanguage]);

  useEffect(() => {
    if (!result) return;
    result.newAchievements.forEach((a) =>
      push({ title: a.title, description: a.description, kind: 'achievement' }),
    );
    if (result.newRecords.length > 0) playSuccess();
  }, [result, push]);

  const begin = () => {
    const entry = pickText(language, length);
    const text = applyOptions(entry.text, options);
    start({ mode: 'free', language, textId: entry.id, options }, text);
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
    return <ResultsScreen result={result} onReplay={begin} onExit={reset} />;
  }

  if (status === 'finished') {
    return null; // résultat en cours de calcul
  }

  if (status === 'running' || status === 'paused' || status === 'invalidated') {
    return (
      <div className="flex flex-col gap-6">
        {typing && <RunHud typing={typing} live={status === 'running'} />}
        {status === 'invalidated' ? (
          <div role="alert" className="rounded-xl border border-err/40 bg-err/10 p-6 text-center">
            <p className="mb-4 font-bold text-err">Run invalidée : la fenêtre a perdu le focus trop longtemps.</p>
            <button
              type="button"
              onClick={reset}
              className="rounded-xl bg-accent px-6 py-2 font-bold text-white"
            >
              Nouvelle run
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

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8">
      <h1 className="text-2xl font-bold">Entraînement libre</h1>

      <section>
        <p className="mb-2 text-sm font-semibold text-muted">Langue</p>
        <div className="flex gap-2">
          {(['fr', 'en'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLanguage(l)}
              className={`rounded-xl border px-4 py-2 font-bold transition-colors ${
                language === l ? 'border-accent bg-accent/15 text-text' : 'border-line text-muted'
              }`}
            >
              {l === 'fr' ? 'Français' : 'English'}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-sm font-semibold text-muted">Longueur</p>
        <div className="flex flex-wrap gap-2">
          {LENGTHS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setLength(value)}
              className={`rounded-xl border px-4 py-2 transition-colors ${
                length === value ? 'border-accent bg-accent/15 text-text' : 'border-line text-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-sm font-semibold text-muted">Difficulté</p>
        <div className="flex flex-col gap-3">
          {TOGGLES.map(({ key: k, label }) => (
            <div key={k} className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-2">
              <span>{label}</span>
              <Toggle
                checked={options[k]}
                onChange={(v) => setOptions((o) => ({ ...o, [k]: v }))}
                label={label}
              />
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={begin}
        className="rounded-xl bg-accent px-8 py-3 text-lg font-bold text-white transition-opacity hover:opacity-90"
      >
        Démarrer
      </button>
    </div>
  );
}
