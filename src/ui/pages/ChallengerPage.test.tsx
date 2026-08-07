import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';
import { db } from '@/db/db';
import { recordChallengerResult } from '@/db/challengerRepo';
import { getOfficialTexts } from '@/texts/corpus';
import { useRunStore } from '@/state/runStore';
import { ChallengerPage } from './ChallengerPage';

const enOfficial = getOfficialTexts('en').map((t) => t.id);

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  useRunStore.getState().reset();
});

describe('ChallengerPage', () => {
  it('affiche la ligue anglaise non classée par défaut puis les 10 textes officiels', async () => {
    render(<MemoryRouter><ChallengerPage /></MemoryRouter>);
    expect(await screen.findByText('Non classé')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Jouer' })).toHaveLength(10));
  });

  it('affiche le tier et le total après des résultats', async () => {
    await recordChallengerResult('en', 'en-101', 60, Date.now(), enOfficial);
    await recordChallengerResult('en', 'en-102', 55, Date.now(), enOfficial);
    render(<MemoryRouter><ChallengerPage /></MemoryRouter>);
    expect(await screen.findByText('Bronze')).toBeInTheDocument();
    expect(screen.getAllByText(/115/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Bronze atteint le/)).toBeInTheDocument();
  });

  it('démarre une run challenger avec tous les toggles actifs', async () => {
    render(<MemoryRouter><ChallengerPage /></MemoryRouter>);
    const buttons = await screen.findAllByRole('button', { name: 'Jouer' });
    await userEvent.click(buttons[0]);
    expect(await screen.findByTestId('typing-area')).toBeInTheDocument();
    const config = useRunStore.getState().config;
    expect(config?.mode).toBe('challenger');
    expect(config?.textId).toBe('en-101');
    expect(config?.options).toEqual({ punctuation: true, specialChars: true, digits: true, accents: true });
  });

  it('démarre une run challenger C avec le code brut multi-lignes', async () => {
    render(<MemoryRouter><ChallengerPage /></MemoryRouter>);
    await userEvent.click(await screen.findByRole('button', { name: 'C' }));
    const buttons = await screen.findAllByRole('button', { name: 'Jouer' });
    await userEvent.click(buttons[0]);
    expect(await screen.findByTestId('typing-area')).toBeInTheDocument();
    const config = useRunStore.getState().config;
    expect(config?.language).toBe('c');
    expect(config?.mode).toBe('challenger');
    expect(useRunStore.getState().typing?.text).toContain('\n');
  });
});
