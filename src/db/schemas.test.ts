import { describe, expect, it } from 'vitest';
import { runRecordSchema } from './schemas';
import type { RunRecord } from './types';

const valid: RunRecord = {
  id: 7,
  date: 1000,
  mode: 'free',
  language: 'fr',
  textId: 'fr-001',
  options: { punctuation: true, specialChars: true, digits: true, accents: true },
  durationMs: 30_000,
  wpm: 50.5,
  accuracy: 0.97,
  points: 66,
  errors: 3,
  backspaces: 2,
  chars: 250,
  noBackspace: false,
};

describe('runRecordSchema', () => {
  it('accepte une run complète et la retourne à l\'identique', () => {
    // toEqual : échoue si le schéma oublie un champ de RunRecord (strip zod)
    expect(runRecordSchema.parse(valid)).toEqual(valid);
  });

  it('accepte l\'absence d\'id (avant auto-incrément)', () => {
    const { id: _id, ...sansId } = valid;
    expect(runRecordSchema.safeParse(sansId).success).toBe(true);
  });

  it.each([
    ['wpm non numérique', { wpm: 'rapide' }],
    ['wpm Infinity', { wpm: Infinity }],
    ['accuracy > 1', { accuracy: 1.5 }],
    ['accuracy NaN', { accuracy: NaN }],
    ['errors négatif', { errors: -1 }],
    ['options null', { options: null }],
    ['mode inconnu', { mode: 'ranked' }],
    ['date nulle', { date: 0 }],
  ])('rejette une run avec %s', (_label, patch) => {
    expect(runRecordSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
});
