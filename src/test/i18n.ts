import type { UiLanguage } from '@/i18n/types';
import { useSettings } from '@/state/settingsStore';

/** Sets the UI language in the test store (pages read it via useSettings). */
export function setUiLanguage(lang: UiLanguage): void {
  useSettings.setState((s) => ({ profile: { ...s.profile, uiLanguage: lang } }));
}
