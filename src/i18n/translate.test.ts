import { describe, expect, it } from 'vitest';
import { translate } from './translate';

describe('translate', () => {
  it('traduit en français et en anglais', () => {
    expect(translate('fr', 'nav.settings')).toBe('Réglages');
    expect(translate('en', 'nav.settings')).toBe('Settings');
  });

  it('interpole les paramètres', () => {
    expect(translate('en', 'home.welcome', { pseudo: 'Ludo' })).toBe('Welcome, Ludo.');
    expect(translate('fr', 'home.welcome', { pseudo: 'Ludo' })).toBe('Bienvenue, Ludo.');
  });

  it('laisse un token non fourni tel quel', () => {
    expect(translate('en', 'home.welcome')).toBe('Welcome, {pseudo}.');
  });
});
