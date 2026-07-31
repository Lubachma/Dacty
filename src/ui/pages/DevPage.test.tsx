import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { db } from '@/db/db';
import { useRunStore } from '@/state/runStore';
import { DevPage } from './DevPage';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  useRunStore.getState().reset();
});

describe('DevPage', () => {
  it('affiche le setup avec C et Python puis démarre une run de code brut', async () => {
    render(<MemoryRouter><DevPage /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'C' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Python' })).toBeInTheDocument();
    expect(screen.getByText('Programme')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Démarrer' }));
    expect(await screen.findByTestId('typing-area')).toBeInTheDocument();
    const state = useRunStore.getState();
    expect(state.config?.mode).toBe('free');
    expect(['c', 'python']).toContain(state.config?.language);
    expect(state.typing?.text).toContain('\n'); // code brut, multi-lignes préservé
  });
});
