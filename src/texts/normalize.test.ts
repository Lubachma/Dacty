import { describe, expect, it } from 'vitest';
import { applyOptions, ALL_OPTIONS_ON } from './normalize';
import type { TextOptions } from './types';

const off = (patch: Partial<TextOptions>): TextOptions => ({ ...ALL_OPTIONS_ON, ...patch });

describe('applyOptions', () => {
  it('retourne le texte intact (hors espaces) quand tout est actif', () => {
    expect(applyOptions('  Bonjour   le  monde ! ', ALL_OPTIONS_ON)).toBe('Bonjour le monde !');
  });

  it('supprime les accents quand accents=false', () => {
    expect(applyOptions('Éléphant à Noël, cœur brisé', off({ accents: false })))
      .toBe('Elephant a Noel, coeur brise');
  });

  it('supprime les chiffres quand digits=false', () => {
    expect(applyOptions('Il a 12 ans et 3 chiens', off({ digits: false })))
      .toBe('Il a  ans et  chiens'.replace(/ +/g, ' ').trim());
  });

  it('ponctuation off : apostrophes/traits d’union → espace, le reste supprimé', () => {
    expect(applyOptions("L'arbre-porte est beau, vraiment !", off({ punctuation: false })))
      .toBe('L arbre porte est beau vraiment');
    expect(applyOptions('« Bonjour » dit-elle.', off({ punctuation: false })))
      .toBe('Bonjour dit elle');
  });

  it('supprime les caractères spéciaux quand specialChars=false', () => {
    expect(applyOptions('Prix : 12€ & 30% #promo @toi', off({ specialChars: false })))
      .toBe('Prix : 12 30 promo toi');
  });

  it('combine tous les toggles off', () => {
    expect(
      applyOptions("L'élève a 15€, soit 20% de « réduction » !", {
        punctuation: false, specialChars: false, digits: false, accents: false,
      }),
    ).toBe('L eleve a soit de reduction');
  });
});
