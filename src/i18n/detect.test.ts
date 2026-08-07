import { afterEach, describe, expect, it } from 'vitest';
import { detectUiLanguage } from './detect';

const original = navigator.language;

function stub(lang: string): void {
  Object.defineProperty(navigator, 'language', { value: lang, configurable: true });
}

afterEach(() => stub(original));

describe('detectUiLanguage', () => {
  it('détecte le français', () => {
    stub('fr-FR');
    expect(detectUiLanguage()).toBe('fr');
  });

  it('détecte toute variante francophone', () => {
    stub('fr-CA');
    expect(detectUiLanguage()).toBe('fr');
  });

  it("retourne l'anglais pour l'anglais", () => {
    stub('en-US');
    expect(detectUiLanguage()).toBe('en');
  });

  it("retourne l'anglais pour toute autre langue", () => {
    stub('de-DE');
    expect(detectUiLanguage()).toBe('en');
  });
});
