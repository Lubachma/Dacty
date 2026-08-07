import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { detectUiLanguage } from '@/i18n/detect';
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

  it('crée un profil avec la langue d’interface détectée', async () => {
    const p = await getProfile();
    expect(p.uiLanguage).toBe(detectUiLanguage());
  });

  it('complète un profil legacy sans uiLanguage avec la langue détectée', async () => {
    const legacy = {
      id: 'default', pseudo: 'Joueur', theme: 'dark', sounds: true,
      defaultLanguage: 'fr', focusTimeoutSec: 5, createdAt: 1, lastActiveAt: 1,
    };
    await db.profile.put(legacy as never);
    const p = await getProfile();
    expect(p.uiLanguage).toBe(detectUiLanguage());
  });

  it('ignore une donnée corrompue au lieu de planter', async () => {
    await db.profile.put({ id: 'default', pseudo: 42 } as never);
    const p = await getProfile();
    expect(p.pseudo).toBe(DEFAULT_PROFILE.pseudo);
  });
});
