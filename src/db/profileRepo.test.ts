import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { DEFAULT_PROFILE, getProfile, updateProfile } from './profileRepo';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('profileRepo', () => {
  it('crée le profil par défaut au premier accès', async () => {
    const p = await getProfile();
    expect(p.pseudo).toBe(DEFAULT_PROFILE.pseudo);
    expect(p.theme).toBe('dark');
    expect(await db.profile.count()).toBe(1);
  });

  it('configure la langue par défaut sur anglais au premier lancement', async () => {
    const p = await getProfile();
    expect(p.defaultLanguage).toBe('en');
  });

  it('met à jour partiellement le profil', async () => {
    await updateProfile({ pseudo: 'Ludo', theme: 'light' });
    const p = await getProfile();
    expect(p.pseudo).toBe('Ludo');
    expect(p.theme).toBe('light');
    expect(p.sounds).toBe(true);
  });

  it('ignore une donnée corrompue au lieu de planter', async () => {
    await db.profile.put({ id: 'default', pseudo: 42 } as never);
    const p = await getProfile();
    expect(p.pseudo).toBe(DEFAULT_PROFILE.pseudo);
  });
});
