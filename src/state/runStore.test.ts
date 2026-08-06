import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { useRunStore } from './runStore';
import { ALL_OPTIONS_ON } from '@/texts/normalize';

const config = { mode: 'free' as const, language: 'fr' as const, textId: 'fr-001', options: ALL_OPTIONS_ON };

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  useRunStore.getState().reset();
});

describe('runStore', () => {
  it('démarre une run et avance à chaque frappe', () => {
    useRunStore.getState().start(config, 'ab');
    expect(useRunStore.getState().status).toBe('running');
    useRunStore.getState().key('a');
    expect(useRunStore.getState().typing?.cursor).toBe(1);
    useRunStore.getState().backspace();
    expect(useRunStore.getState().typing?.cursor).toBe(0);
  });

  it('termine la run et remplit le résultat', async () => {
    useRunStore.getState().start(config, 'ab');
    useRunStore.getState().key('a');
    useRunStore.getState().key('b');
    expect(useRunStore.getState().status).toBe('finished');
    await vi.waitFor(() => expect(useRunStore.getState().result).not.toBeNull());
    expect(useRunStore.getState().result?.run.chars).toBe(2);
    expect(useRunStore.getState().result?.run.mode).toBe('free');
  });

  it('ignore les frappes quand la run est en pause ou invalidée', () => {
    useRunStore.getState().start(config, 'ab');
    useRunStore.getState().key('a');
    useRunStore.getState().pause();
    useRunStore.getState().key('b');
    expect(useRunStore.getState().typing?.cursor).toBe(1);
    useRunStore.getState().resume();
    useRunStore.getState().invalidate();
    useRunStore.getState().key('b');
    expect(useRunStore.getState().status).toBe('invalidated');
  });

  it('auto-indente les espaces après un saut de ligne correct', () => {
    useRunStore.getState().start(config, 'a\n    b');
    useRunStore.getState().key('a');
    useRunStore.getState().key('\n');
    // le curseur a sauté les 4 espaces d'indentation automatiquement
    expect(useRunStore.getState().typing?.cursor).toBe(6);
    expect(useRunStore.getState().typing?.statuses.slice(0, 6)).toEqual(
      ['correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
    );
  });

  it("n'auto-indente pas après un saut de ligne incorrect", () => {
    useRunStore.getState().start(config, 'ab\n  c');
    useRunStore.getState().key('\n'); // attendu: 'a' -> erreur, pas d'indentation
    const typing = useRunStore.getState().typing;
    expect(typing?.statuses[0]).toBe('incorrect');
    expect(typing?.cursor).toBe(1);
    expect(typing?.statuses[1]).toBe('pending');
  });

  it("l'auto-indentation ne gonfle ni les frappes ni les événements", () => {
    useRunStore.getState().start(config, 'a\n    b');
    useRunStore.getState().key('a');
    useRunStore.getState().key('\n');
    const typing = useRunStore.getState().typing;
    // seules les vraies frappes ('a' et '\n') comptent pour la précision et la timeline
    expect(typing?.keystrokes).toBe(2);
    expect(typing?.events).toHaveLength(2);
  });
});
