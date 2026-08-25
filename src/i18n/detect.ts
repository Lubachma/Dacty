import type { UiLanguage } from './types';

/**
 * Default interface language: French if the browser is French-speaking,
 * English otherwise (international audience). Kept for environments without a browser.
 */
export function detectUiLanguage(): UiLanguage {
  if (typeof navigator === 'undefined' || typeof navigator.language !== 'string') return 'en';
  return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}
