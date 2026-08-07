import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';
import { db } from '@/db/db';
import { saveRun } from '@/db/runsRepo';
import { setUiLanguage } from '@/test/i18n';
import { HomePage } from './HomePage';

beforeEach(async () => {
  setUiLanguage('fr');
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('HomePage', () => {
  it('affiche le hero et les deux accès aux modes', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Dacty' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entraînement libre' })).toHaveAttribute('href', '/play');
    expect(screen.getByRole('link', { name: 'Mode Challenger' })).toHaveAttribute('href', '/challenger');
  });

  it('affiche les dernières runs', async () => {
    await saveRun({
      date: Date.now(), mode: 'free', language: 'fr', textId: 'fr-001',
      options: { punctuation: true, specialChars: true, digits: true, accents: true },
      durationMs: 20_000, wpm: 55.4, accuracy: 0.97, points: 74, errors: 2,
      backspaces: 1, chars: 200, noBackspace: false,
    });
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(await screen.findByText(/55\.4/)).toBeInTheDocument();
  });
});
