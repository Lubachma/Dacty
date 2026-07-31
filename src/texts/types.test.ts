import { describe, expect, it } from 'vitest';
import { CODE_LANGUAGES, isCodeLanguage, LANGUAGE_LABELS } from './types';
import { languageSchema } from '@/db/schemas';

describe('types', () => {
  it('identifie les langages de code', () => {
    expect(CODE_LANGUAGES).toEqual(['c', 'python']);
    expect(isCodeLanguage('c')).toBe(true);
    expect(isCodeLanguage('python')).toBe(true);
    expect(isCodeLanguage('fr')).toBe(false);
    expect(isCodeLanguage('en')).toBe(false);
  });

  it('a un label par langage', () => {
    expect(LANGUAGE_LABELS).toEqual({ fr: 'Français', en: 'English', c: 'C', python: 'Python' });
  });

  it('le schéma zod accepte les 4 langages', () => {
    for (const lang of ['fr', 'en', 'c', 'python']) {
      expect(languageSchema.safeParse(lang).success).toBe(true);
    }
    expect(languageSchema.safeParse('rust').success).toBe(false);
  });
});
