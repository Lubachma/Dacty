import { useEffect, useState } from 'react';
import { useRunStore } from '@/state/runStore';
import { useSettings } from '@/state/settingsStore';
import { useToasts } from '@/state/toastStore';
import { useFocusGuard } from '@/ui/hooks/useFocusGuard';
import { usePauseRunOnUnmount } from '@/ui/hooks/usePauseRunOnUnmount';
import { TypingArea } from '@/ui/components/TypingArea';
import { RunControls } from '@/ui/components/RunControls';
import { RunHud } from '@/ui/components/RunHud';
import { ResultsScreen } from '@/ui/components/ResultsScreen';
import { playError, playKey, playSuccess } from '@/ui/sounds';
import { pick, useT } from '@/i18n';
import type { TranslationKey } from '@/i18n/fr';
import { pickText } from '@/texts/corpus';
import { ALL_OPTIONS_ON } from '@/texts/normalize';
import { CODE_LANGUAGES, LANGUAGE_LABELS } from '@/texts/types';
import type { Language, TextLength } from '@/texts/types';

const LENGTHS: { value: TextLength; key: TranslationKey }[] = [
  { value: 'short', key: 'dev.length.short' },
  { value: 'medium', key: 'dev.length.medium' },
  { value: 'long', key: 'dev.length.long' },
];

export function DevPage() {
  const { status, typing, result, start, key, backspace, reset } = useRunStore();
  const profile = useSettings((s) => s.profile);
  const push = useToasts((s) => s.push);
  const t = useT();
  const [language, setLanguage] = useState<Language>('python');
  const [length, setLength] = useState<TextLength>('short');
  useFocusGuard();
  usePauseRunOnUnmount();

  useEffect(() => {
    if (!result) return;
    result.newAchievements.forEach((a) =>
      push({
        title: pick(a.title, profile.uiLanguage),
        description: pick(a.description, profile.uiLanguage),
        kind: 'achievement',
      }),
    );
    if (result.newRecords.length > 0) playSuccess();
  }, [result, push, profile.uiLanguage]);

  const begin = () => {
    const entry = pickText(language, length);
    // code brut : jamais applyOptions (détruirait les sauts de ligne)
    start({ mode: 'free', language, textId: entry.id, options: ALL_OPTIONS_ON }, entry.text);
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
        {typing && <RunHud typing={typing} />}
        {status === 'invalidated' ? (
          <div className="rounded-xl border border-err/40 bg-err/10 p-6 text-center">
            <p className="mb-4 font-bold text-err">{t('run.invalidated')}</p>
            <button
              type="button"
              onClick={reset}
              className="rounded-xl bg-accent-strong px-6 py-2 font-bold text-white"
            >
              {t('run.newRun')}
            </button>
          </div>
        ) : (
          typing && (
            <>
              {status === 'paused' && (
                <p className="text-center text-sm text-muted">{t('run.paused')}</p>
              )}
              <TypingArea state={typing} disabled={status !== 'running'} onChar={handleChar} onBackspace={backspace} />
              <RunControls />
            </>
          )
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">{t('dev.title')}</h1>
        <p className="mt-1 text-sm text-muted">
          {t('dev.subtitle')}
        </p>
      </div>

      <section>
        <p className="mb-2 text-sm font-semibold text-muted">{t('dev.language')}</p>
        <div className="flex gap-2">
          {CODE_LANGUAGES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLanguage(l)}
              className={`rounded-xl border px-4 py-2 font-bold transition-colors ${
                language === l ? 'border-accent bg-accent/15 text-text' : 'border-line text-muted'
              }`}
            >
              {LANGUAGE_LABELS[l]}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-sm font-semibold text-muted">{t('dev.length')}</p>
        <div className="flex flex-wrap gap-2">
          {LENGTHS.map(({ value, key }) => (
            <button
              key={value}
              type="button"
              onClick={() => setLength(value)}
              className={`rounded-xl border px-4 py-2 transition-colors ${
                length === value ? 'border-accent bg-accent/15 text-text' : 'border-line text-muted'
              }`}
            >
              {t(key)}
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={begin}
        className="rounded-xl bg-accent-strong px-8 py-3 text-lg font-bold text-white transition-opacity hover:opacity-90"
      >
        {t('dev.start')}
      </button>
    </div>
  );
}
