import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { checkPersistence, requestPersistence } from '@/db/persistence';
import { Layout } from './Layout';

vi.mock('@/db/persistence', () => ({
  checkPersistence: vi.fn().mockResolvedValue(true),
  requestPersistence: vi.fn().mockResolvedValue(undefined),
}));

const mockedCheck = vi.mocked(checkPersistence);
const mockedRequest = vi.mocked(requestPersistence);

describe('Layout', () => {
  it('affiche la navigation principale', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Entraînement' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dev' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Challenger' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Classements' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Succès' })).toBeInTheDocument();
  });

  it('demande le stockage persistant au montage', async () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );
    await vi.waitFor(() => expect(mockedRequest).toHaveBeenCalled());
  });

  it('annonce le bandeau de stockage indisponible comme une alerte', async () => {
    mockedCheck.mockResolvedValueOnce(false);
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
