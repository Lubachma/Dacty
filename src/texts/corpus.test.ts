import { describe, expect, it } from 'vitest';
import { CORPUS, getOfficialTexts, getTextById, getTexts, pickText } from './corpus';

describe('corpus', () => {
  it('contient 80 textes avec le champ language injecté', () => {
    expect(CORPUS).toHaveLength(80);
    expect(CORPUS.every((t) => t.language === 'fr' || t.language === 'en')).toBe(true);
  });

  it('getTexts retourne les 30 textes libres de la langue', () => {
    expect(getTexts('fr')).toHaveLength(30);
    expect(getTexts('fr').every((t) => !t.official && t.language === 'fr')).toBe(true);
  });

  it('getOfficialTexts retourne les 10 officiels triés par id', () => {
    const official = getOfficialTexts('en');
    expect(official).toHaveLength(10);
    expect(official[0].id).toBe('en-101');
    expect(official[9].id).toBe('en-110');
  });

  it('getTextById trouve un texte et throw sinon', () => {
    expect(getTextById('fr-001').language).toBe('fr');
    expect(() => getTextById('xx-999')).toThrow('xx-999');
  });

  it('pickText respecte la catégorie demandée', () => {
    expect(pickText('fr', 'short').length).toBe('short');
    expect(pickText('en', 'long').length).toBe('long');
    expect(pickText('fr', 'quote').quote).toBe(true);
  });
});
