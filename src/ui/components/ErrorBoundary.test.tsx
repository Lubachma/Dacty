import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

let shouldThrow = true;
function Bomb() {
  if (shouldThrow) throw new Error('boom');
  return <p>contenu sain</p>;
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    shouldThrow = true;
    vi.restoreAllMocks();
  });

  it('confine l\'erreur : fallback actionnable, reste de la page intact', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {}); // React logue l'erreur
    render(
      <MemoryRouter>
        <header>en-tête</header>
        <ErrorBoundary resetKey="/boom">
          <Bomb />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Une erreur est survenue');
    expect(screen.getByText('en-tête')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Retour à l\'accueil' })).toHaveAttribute('href', '/');
  });

  it('« Réessayer » réinitialise le boundary', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ErrorBoundary resetKey="/boom">
          <Bomb />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(screen.getByText('contenu sain')).toBeInTheDocument();
  });

  it('se réinitialise quand resetKey change (navigation)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = render(
      <MemoryRouter>
        <ErrorBoundary resetKey="/a">
          <Bomb />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    shouldThrow = false;
    rerender(
      <MemoryRouter>
        <ErrorBoundary resetKey="/b">
          <Bomb />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(screen.getByText('contenu sain')).toBeInTheDocument();
  });
});
