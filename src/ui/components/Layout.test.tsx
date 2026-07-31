import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Layout } from './Layout';

describe('Layout', () => {
  it('affiche la navigation principale', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Entraînement' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Challenger' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Classements' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Succès' })).toBeInTheDocument();
  });
});
