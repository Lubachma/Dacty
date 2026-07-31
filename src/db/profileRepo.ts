import { db } from './db';
import { profileSchema } from './schemas';
import type { Profile } from './types';

export const DEFAULT_PROFILE: Profile = {
  id: 'default',
  pseudo: 'Joueur',
  theme: 'dark',
  sounds: true,
  defaultLanguage: 'fr',
  focusTimeoutSec: 5,
  createdAt: 0,
  lastActiveAt: 0,
};

export async function getProfile(): Promise<Profile> {
  const raw = await db.profile.get('default');
  if (raw) {
    const parsed = profileSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
    // donnée corrompue : on réinitialise sans planter
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
