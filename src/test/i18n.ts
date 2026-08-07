import type { UiLanguage } from '@/i18n/types';
import { useSettings } from '@/state/settingsStore';

/** Pose la langue d'interface dans le store de test (les pages la lisent via useSettings). */
export function setUiLanguage(lang: UiLanguage): void {
  useSettings.setState((s) => ({ profile: { ...s.profile, uiLanguage: lang } }));
}
