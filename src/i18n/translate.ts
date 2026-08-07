import { en } from './en';
import { fr, type TranslationKey } from './fr';
import type { Params, UiLanguage } from './types';

const DICTS: Record<UiLanguage, Record<TranslationKey, string>> = { fr, en };

/** Traduction pure + interpolation `{token}` ; token non fourni = laissé tel quel. */
export function translate(lang: UiLanguage, key: TranslationKey, params?: Params): string {
  const template: string = DICTS[lang][key];
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (raw, name: string) =>
    params[name] === undefined ? raw : String(params[name]),
  );
}
