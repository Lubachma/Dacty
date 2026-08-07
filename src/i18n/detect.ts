import type { UiLanguage } from './types';

/**
 * Langue d'interface par défaut : français si le navigateur est francophone,
 * anglais sinon (public international). Gardée pour les environnements sans navigateur.
 */
export function detectUiLanguage(): UiLanguage {
  if (typeof navigator === 'undefined' || typeof navigator.language !== 'string') return 'en';
  return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}
