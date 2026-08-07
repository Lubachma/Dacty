import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { useRunStore } from '@/state/runStore';
import { RunControls } from './RunControls';
import { ALL_OPTIONS_ON } from '@/texts/normalize';

const config = { mode: 'free' as const, language: 'fr' as const, textId: 'fr-001', options: ALL_OPTIONS_ON };

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  useRunStore.getState().reset();
});

describe('RunControls', () => {
  it('« Recommencer » relance le même texte à zéro', async () => {
    const user = userEvent.setup();
    useRunStore.getState().start(config, 'ab');
    useRunStore.getState().key('a');
    render(<RunControls />);
    await user.click(screen.getByRole('button', { name: 'Recommencer' }));
    const s = useRunStore.getState();
    expect(s.status).toBe('running');
    expect(s.typing?.text).toBe('ab');
    expect(s.typing?.cursor).toBe(0);
    expect(s.typing?.keystrokes).toBe(0);
  });

  it('« Recommencer » depuis une run en pause repart en running, état frais', async () => {
    const user = userEvent.setup();
    useRunStore.getState().start(config, 'ab');
    useRunStore.getState().key('a');
    useRunStore.getState().pause();
    render(<RunControls />);
    await user.click(screen.getByRole('button', { name: 'Recommencer' }));
    const s = useRunStore.getState();
    expect(s.status).toBe('running');
    expect(s.typing?.cursor).toBe(0);
    expect(s.typing?.pausedMs).toBe(0);
  });

  it('« Arrêter » abandonne la run : statut idle, typing null', async () => {
    const user = userEvent.setup();
    useRunStore.getState().start(config, 'ab');
    useRunStore.getState().key('a');
    render(<RunControls />);
    await user.click(screen.getByRole('button', { name: 'Arrêter' }));
    const s = useRunStore.getState();
    expect(s.status).toBe('idle');
    expect(s.typing).toBeNull();
  });
});
