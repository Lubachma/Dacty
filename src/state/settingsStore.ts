import { create } from 'zustand';
import { DEFAULT_PROFILE, getProfile, updateProfile } from '@/db/profileRepo';
import type { Profile } from '@/db/types';
import { setSoundsEnabled } from '@/ui/sounds';

export function applyTheme(theme: 'dark' | 'light'): void {
  document.documentElement.dataset.theme = theme;
}

export function applyUiLanguage(lang: 'fr' | 'en'): void {
  document.documentElement.lang = lang;
}

interface SettingsStore {
  profile: Profile;
  loaded: boolean;
  load(): Promise<void>;
  update(patch: Partial<Profile>): Promise<void>;
}

export const useSettings = create<SettingsStore>((set, get) => ({
  profile: DEFAULT_PROFILE,
  loaded: false,
  async load() {
    let profile = DEFAULT_PROFILE;
    try {
      profile = await getProfile();
    } catch {
      // IndexedDB unavailable: in-memory session with the default profile
    }
    applyTheme(profile.theme);
    applyUiLanguage(profile.uiLanguage);
    setSoundsEnabled(profile.sounds);
    set({ profile, loaded: true });
  },
  async update(patch) {
    // apply locally right away (instant feedback), persist afterward
    set({ profile: { ...get().profile, ...patch } });
    if (patch.theme) applyTheme(patch.theme);
    if (patch.uiLanguage) applyUiLanguage(patch.uiLanguage);
    if (patch.sounds !== undefined) setSoundsEnabled(patch.sounds);
    try {
      await updateProfile(patch);
    } catch {
      // persistence unavailable: the setting only applies for this session
    }
  },
}));
