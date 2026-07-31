import { describe, expect, it } from 'vitest';
import { CORPUS, getOfficialTexts, getTextById, getTexts, pickText } from './corpus';

describe('corpus', () => {
  it('contient 130 textes avec le champ language injecté', () => {
    expect(CORPUS).toHaveLength(130);
    expect(CORPUS.every((t) => ['fr', 'en', 'c', 'python'].includes(t.language))).toBe(true);
  });

  it('getTexts retourne les 30 textes libres de la langue', () => {
    expect(getTexts('fr')).toHaveLength(30);
    expect(getTexts('fr').every((t) => !t.official && t.language === 'fr')).toBe(true);
  });

  it('getTexts retourne 15 textes par langage de code', () => {
    expect(getTexts('c')).toHaveLength(15);
    expect(getTexts('python')).toHaveLength(15);
    expect(getTexts('c').every((t) => !t.official && t.language === 'c')).toBe(true);
  });

  it('getOfficialTexts retourne les 10 officiels triés par id', () => {
    const official = getOfficialTexts('en');
    expect(official).toHaveLength(10);
    expect(official[0].id).toBe('en-101');
    expect(official[9].id).toBe('en-110');
  });

  it('getOfficialTexts retourne les 10 officiels par langage de code', () => {
    const official = getOfficialTexts('python');
    expect(official).toHaveLength(10);
    expect(official[0].id).toBe('python-101');
    expect(official[9].id).toBe('python-110');
    expect(getOfficialTexts('c')).toHaveLength(10);
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

  it('pickText fonctionne pour les langages de code', () => {
    expect(pickText('python', 'short').language).toBe('python');
    expect(pickText('c', 'long').length).toBe('long');
  });
});
