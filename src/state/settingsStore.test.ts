import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { useSettings } from './settingsStore';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  useSettings.setState({ profile: { ...useSettings.getState().profile, pseudo: 'Joueur' }, loaded: false });
});

describe('settingsStore', () => {
  it('charge le profil par défaut puis persiste les modifications', async () => {
    await useSettings.getState().load();
    expect(useSettings.getState().loaded).toBe(true);
    expect(useSettings.getState().profile.pseudo).toBe('Joueur');
    await useSettings.getState().update({ pseudo: 'Ludo', sounds: false });
    expect(useSettings.getState().profile.pseudo).toBe('Ludo');
    const { getProfile } = await import('@/db/profileRepo');
    expect((await getProfile()).sounds).toBe(false);
  });
});
