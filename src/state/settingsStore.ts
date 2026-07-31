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
    const profile = await getProfile();
    applyTheme(profile.theme);
    setSoundsEnabled(profile.sounds);
    set({ profile, loaded: true });
  },
  async update(patch) {
    await updateProfile(patch);
    set({ profile: { ...get().profile, ...patch } });
    if (patch.theme) applyTheme(patch.theme);
    if (patch.sounds !== undefined) setSoundsEnabled(patch.sounds);
  },
}));
