import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PROFILE } from '@/db/profileRepo';

vi.mock('@/db/profileRepo', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/db/profileRepo')>();
  return {
    ...original,
    getProfile: () => Promise.reject(new Error('IndexedDB blocked')),
    updateProfile: () => Promise.reject(new Error('IndexedDB blocked')),
  };
});

import { useSettings } from './settingsStore';

beforeEach(() => {
  useSettings.setState({ profile: DEFAULT_PROFILE, loaded: false });
});

describe('settingsStore sans persistance', () => {
  it('load tombe sur le profil par défaut et update applique en mémoire', async () => {
    await useSettings.getState().load();
    expect(useSettings.getState().loaded).toBe(true);
    expect(useSettings.getState().profile.pseudo).toBe(DEFAULT_PROFILE.pseudo);
    await useSettings.getState().update({ pseudo: 'Local', theme: 'light' });
    expect(useSettings.getState().profile.pseudo).toBe('Local');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
