import { useCallback } from 'react';
import { useSettings } from '@/state/settingsStore';
import type { Tier } from '@/scoring/league';
import type { TranslationKey } from './fr';
import { translate } from './translate';
import type { LocalizedText, Params, UiLanguage } from './types';

export function useUiLanguage(): UiLanguage {
  return useSettings((s) => s.profile.uiLanguage);
}

/** Translation closure memoized on the current language. */
export function useT(): (key: TranslationKey, params?: Params) => string {
  const lang = useUiLanguage();
  return useCallback((key: TranslationKey, params?: Params) => translate(lang, key, params), [lang]);
}

export function localeFor(lang: UiLanguage): string {
  return lang === 'fr' ? 'fr-FR' : 'en-US';
}

/** Date formatter in the interface locale (recreated on each render, negligible cost here). */
export function useDateFormatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(localeFor(useUiLanguage()), options);
}

/** Picks the language of a text carried by the data (achievements). */
export function pick(text: LocalizedText, lang: UiLanguage): string {
  return text[lang];
}

export function tierLabel(tier: Tier, lang: UiLanguage): string {
  return translate(lang, `tier.${tier}` as TranslationKey);
}
