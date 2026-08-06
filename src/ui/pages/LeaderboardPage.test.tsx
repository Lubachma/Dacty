import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';
import { db } from '@/db/db';
import { saveRun } from '@/db/runsRepo';
import { LeaderboardPage } from './LeaderboardPage';

const opts = { punctuation: true, specialChars: true, digits: true, accents: true };

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  await saveRun({
    date: Date.now(), mode: 'free', language: 'fr', textId: 'fr-001', options: opts,
    durationMs: 25_000, wpm: 62.5, accuracy: 0.98, points: 88, errors: 2,
    backspaces: 1, chars: 260, noBackspace: false,
  });
});

describe('LeaderboardPage', () => {
  it('affiche les runs et les records personnels', async () => {
    render(<MemoryRouter><LeaderboardPage /></MemoryRouter>);
    expect(await screen.findByText('62.5')).toBeInTheDocument();
    expect(screen.getByText('98 %')).toBeInTheDocument();
    expect(screen.getByText('Meilleur WPM')).toBeInTheDocument();
  });

  it('affiche un état vide sans runs', async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
    render(<MemoryRouter><LeaderboardPage /></MemoryRouter>);
    expect(await screen.findByText(/Aucune run enregistrée/)).toBeInTheDocument();
  });
});
