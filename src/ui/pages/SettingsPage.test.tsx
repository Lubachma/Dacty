import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { db } from '@/db/db';
import { useSettings } from '@/state/settingsStore';
import { getProfile } from '@/db/profileRepo';
import { SettingsPage } from './SettingsPage';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  await useSettings.getState().load();
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
});
