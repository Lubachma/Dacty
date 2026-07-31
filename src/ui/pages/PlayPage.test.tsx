import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { db } from '@/db/db';
import { useRunStore } from '@/state/runStore';
import { PlayPage } from './PlayPage';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  useRunStore.getState().reset();
});

describe('PlayPage', () => {
  it('affiche le setup puis démarre une run', async () => {
    render(<MemoryRouter><PlayPage /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Démarrer' })).toBeInTheDocument();
    expect(screen.getByText('Ponctuation')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Démarrer' }));
    expect(await screen.findByTestId('typing-area')).toBeInTheDocument();
    expect(useRunStore.getState().config?.mode).toBe('free');
  });
});
