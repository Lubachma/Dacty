import { describe, expect, it } from 'vitest';
import { en } from './en';
import { fr } from './fr';

const tokens = (s: string): string[] => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('dictionnaires', () => {
  it('en et fr exposent exactement les mêmes clés', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(fr).sort());
  });

  it('chaque clé a les mêmes tokens d’interpolation en fr et en', () => {
    for (const key of Object.keys(fr) as (keyof typeof fr)[]) {
      expect(tokens(en[key]), `tokens de "${key}"`).toEqual(tokens(fr[key]));
    }
  });
});
