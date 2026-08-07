import 'fake-indexeddb/auto';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';
import { db } from '@/db/db';
import { useSettings } from '@/state/settingsStore';
import { getProfile } from '@/db/profileRepo';
import { setUiLanguage } from '@/test/i18n';
import { SettingsPage } from './SettingsPage';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  await useSettings.getState().load();
  setUiLanguage('fr');
});

describe('SettingsPage', () => {
  it('modifie le pseudo et persiste', async () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    const input = await screen.findByLabelText('Pseudo');
    await userEvent.clear(input);
    await userEvent.type(input, 'Ludo');
    await userEvent.tab(); // blur -> sauvegarde
    expect((await getProfile()).pseudo).toBe('Ludo');
    expect(useSettings.getState().profile.pseudo).toBe('Ludo');
  });

  it('bascule le thème', async () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    await userEvent.click(await screen.findByRole('switch', { name: 'Thème clair' }));
    expect(useSettings.getState().profile.theme).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('resynchronise le pseudo quand le profil se charge', async () => {
    // simule un deep-link : le profil n'est pas encore chargé au mount
    useSettings.setState((s) => ({ profile: { ...s.profile, pseudo: 'Joueur' }, loaded: false }));
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    expect(screen.getByLabelText('Pseudo')).toHaveValue('Joueur');
    await act(async () => {
      useSettings.setState((s) => ({ profile: { ...s.profile, pseudo: 'Ludo' }, loaded: true }));
    });
    expect(screen.getByLabelText('Pseudo')).toHaveValue('Ludo');
  });

  it('bascule la langue de l’interface et persiste', async () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    // deux rows ont des boutons autonymes : on cible celle de la langue d'interface
    const uiLangRow = (await screen.findByText("Langue de l'interface")).parentElement!;
    await userEvent.click(within(uiLangRow).getByRole('button', { name: 'English' }));
    expect(useSettings.getState().profile.uiLanguage).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect((await getProfile()).uiLanguage).toBe('en');
    // l'UI bascule immédiatement
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();
  });

  it('affiche l’interface en anglais', async () => {
    setUiLanguage('en');
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('Interface language')).toBeInTheDocument();
  });
});
