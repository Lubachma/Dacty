import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { DEFAULT_PROFILE, getProfile } from '@/db/profileRepo';
import { detectUiLanguage } from '@/i18n/detect';
import { useSettings } from './settingsStore';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  useSettings.setState({ profile: { ...useSettings.getState().profile, pseudo: 'Joueur' }, loaded: false });
});

describe('settingsStore', () => {
  it('charge le profil par défaut puis persiste les modifications', async () => {
    await useSettings.getState().load();
    expect(useSettings.getState().loaded).toBe(true);
    expect(useSettings.getState().profile.pseudo).toBe(DEFAULT_PROFILE.pseudo);
    await useSettings.getState().update({ pseudo: 'Ludo', sounds: false });
    expect(useSettings.getState().profile.pseudo).toBe('Ludo');
    const { getProfile } = await import('@/db/profileRepo');
    expect((await getProfile()).sounds).toBe(false);
  });

  it("pose document lang au chargement et à la mise à jour de uiLanguage", async () => {
    await useSettings.getState().load();
    expect(document.documentElement.lang).toBe(detectUiLanguage());
    await useSettings.getState().update({ uiLanguage: 'fr' });
    expect(document.documentElement.lang).toBe('fr');
    expect((await getProfile()).uiLanguage).toBe('fr');
  });
});
