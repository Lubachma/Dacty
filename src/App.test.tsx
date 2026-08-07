import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { setUiLanguage } from '@/test/i18n';
import App from './App';

beforeEach(() => setUiLanguage('fr'));

describe('App', () => {
  it('rend la page d\'accueil', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(await screen.findByRole('heading', { name: /Dacty/ })).toBeInTheDocument();
  });

  it('affiche un fallback pendant le chargement d\'une page lazy, header visible', async () => {
    window.history.pushState({}, '', '/achievements');
    render(<App />);
    // chunk pas encore résolu : fallback dans <main>, header toujours présent
    expect(screen.getByText('Chargement…')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dacty' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Succès' })).toBeInTheDocument();
  });

  it('définit le titre de l\'onglet selon la route', async () => {
    window.history.pushState({}, '', '/');
    const { unmount } = render(<App />);
    expect(await screen.findByRole('heading', { name: /Dacty/ })).toBeInTheDocument();
    expect(document.title).toBe('Dacty');
    unmount();

    window.history.pushState({}, '', '/settings');
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Réglages' })).toBeInTheDocument();
    expect(document.title).toBe('Réglages · Dacty');
  });
});
