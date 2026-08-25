import { en } from './en';
import { fr, type TranslationKey } from './fr';
import type { Params, UiLanguage } from './types';

const DICTS: Record<UiLanguage, Record<TranslationKey, string>> = { fr, en };

/** Pure translation + `{token}` interpolation; a missing token is left as-is. */
export function translate(lang: UiLanguage, key: TranslationKey, params?: Params): string {
  const template: string = DICTS[lang][key];
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (raw, name: string) =>
    params[name] === undefined ? raw : String(params[name]),
  );
}
