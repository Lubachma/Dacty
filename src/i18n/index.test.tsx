import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { setUiLanguage } from '@/test/i18n';
import { localeFor, pick, tierLabel, useT, useUiLanguage } from './index';

function Probe() {
  const t = useT();
  const lang = useUiLanguage();
  return <p>{lang}:{t('nav.settings')}</p>;
}

beforeEach(() => setUiLanguage('fr'));

describe('i18n hooks', () => {
  it('useT rend la langue courante et re-rend au changement', () => {
    const { rerender } = render(<Probe />);
    expect(screen.getByText('fr:Réglages')).toBeInTheDocument();
    act(() => setUiLanguage('en'));
    rerender(<Probe />);
    expect(screen.getByText('en:Settings')).toBeInTheDocument();
  });

  it('localeFor mappe les locales de formatage', () => {
    expect(localeFor('fr')).toBe('fr-FR');
    expect(localeFor('en')).toBe('en-US');
  });

  it('pick choisit la langue d’un texte localisé', () => {
    expect(pick({ fr: 'Bonjour', en: 'Hello' }, 'en')).toBe('Hello');
  });

  it('tierLabel traduit les noms de tiers', () => {
    expect(tierLabel('argent', 'fr')).toBe('Argent');
    expect(tierLabel('argent', 'en')).toBe('Silver');
    expect(tierLabel('challenger', 'en')).toBe('Challenger');
  });
});
