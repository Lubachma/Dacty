import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

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
});
