import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';
import { db } from '@/db/db';
import { setUiLanguage } from '@/test/i18n';
import { AchievementsPage } from './AchievementsPage';

beforeEach(async () => {
  setUiLanguage('fr');
  await Promise.all(db.tables.map((t) => t.clear()));
  await db.achievements.add({ id: 'wpm-40', unlockedAt: Date.now() });
});

describe('AchievementsPage', () => {
  it('affiche les 28 succès et le compteur de déblocage', async () => {
    render(<MemoryRouter><AchievementsPage /></MemoryRouter>);
    expect(await screen.findByText('1 / 28')).toBeInTheDocument();
    expect(screen.getByText('Échauffement')).toBeInTheDocument();
    expect(screen.getByText('Inhumain')).toBeInTheDocument();
    // "Challenger" appears twice: section title and the "Challenger" achievement
    expect(screen.getAllByText('Challenger').length).toBeGreaterThan(0);
  });

  it('affiche les succès en anglais quand uiLanguage est en', async () => {
    setUiLanguage('en');
    render(<MemoryRouter><AchievementsPage /></MemoryRouter>);
    expect(await screen.findByText('Warm-up')).toBeInTheDocument();
    expect(screen.getByText('Inhuman')).toBeInTheDocument();
  });

  it('affiche la progression des succès verrouillés', async () => {
    await db.runs.add({
      date: Date.now(), mode: 'free', language: 'fr', textId: 'fr-001',
      options: { punctuation: true, specialChars: true, digits: true, accents: true },
      durationMs: 20_000, wpm: 45, accuracy: 0.99, points: 62, errors: 1,
      backspaces: 0, chars: 200, noBackspace: true,
    });
    render(<MemoryRouter><AchievementsPage /></MemoryRouter>);
    // sharpshooter-10 (1 run ≥ 98%) and runs-10 (1 run) both show "1 / 10"
    expect((await screen.findAllByText('1 / 10')).length).toBeGreaterThan(0);
  });
});
