import { create } from 'zustand';
import { DEFAULT_PROFILE, getProfile, updateProfile } from '@/db/profileRepo';
import type { Profile } from '@/db/types';
import { setSoundsEnabled } from '@/ui/sounds';

export function applyTheme(theme: 'dark' | 'light'): void {
  document.documentElement.dataset.theme = theme;
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
      // IndexedDB indisponible : session en mémoire avec le profil par défaut
    }
    applyTheme(profile.theme);
    setSoundsEnabled(profile.sounds);
    set({ profile, loaded: true });
  },
  async update(patch) {
    // application locale immédiate (feedback instantané), persistance ensuite
    set({ profile: { ...get().profile, ...patch } });
    if (patch.theme) applyTheme(patch.theme);
    if (patch.sounds !== undefined) setSoundsEnabled(patch.sounds);
    try {
      await updateProfile(patch);
    } catch {
      // persistance indisponible : le réglage ne vaut que pour la session
    }
  },
}));
