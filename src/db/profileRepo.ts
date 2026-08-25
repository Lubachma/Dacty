import { db } from './db';
import { profileSchema } from './schemas';
import type { Profile } from './types';
import { detectUiLanguage } from '@/i18n/detect';

export const DEFAULT_PROFILE: Profile = {
  id: 'default',
  pseudo: detectUiLanguage() === 'fr' ? 'Joueur' : 'Player',
  theme: 'dark',
  sounds: true,
  defaultLanguage: 'en',
  uiLanguage: detectUiLanguage(),
  focusTimeoutSec: 5,
  createdAt: 0,
  lastActiveAt: 0,
};

export async function getProfile(): Promise<Profile> {
  const raw = await db.profile.get('default');
  if (raw) {
    const parsed = profileSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
    // corrupted data: reset without crashing
  }
  const now = Date.now();
  const fresh: Profile = { ...DEFAULT_PROFILE, createdAt: now, lastActiveAt: now };
  await db.profile.put(fresh);
  return fresh;
}

export async function updateProfile(patch: Partial<Profile>): Promise<void> {
  const current = await getProfile();
  await db.profile.put({ ...current, ...patch, id: 'default', lastActiveAt: Date.now() });
}
