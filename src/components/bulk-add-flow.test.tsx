import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Candidate } from '@/lib/actions/recommendations';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

// Server actions mockeadas.
const searchCandidates = vi.fn();
const bulkAddItem = vi.fn();
const bulkAddDone = vi.fn();
vi.mock('@/lib/actions/recommendations', () => ({
  searchCandidates: (...a: unknown[]) => searchCandidates(...a),
  bulkAddItem: (...a: unknown[]) => bulkAddItem(...a),
  bulkAddDone: (...a: unknown[]) => bulkAddDone(...a),
}));

// CategoryPicker real arrastra demasiadas dependencias; lo sustituimos por un
// botón que fija una categoría, que es lo único que el wizard necesita.
vi.mock('@/components/new-recommendation-flow', () => ({
  CategoryPicker: ({ onChange }: { onChange: (c: unknown) => void }) => (
    <button type="button" onClick={() => onChange({ id: 'cat1', name: 'Película' })}>
      pick-category
    </button>
  ),
}));

import { BulkAddFlow } from './bulk-add-flow';

const categories = [{ id: 'cat1', name: 'Película', icon: 'Clapperboard' }];

const candidatesFor = (title: string): Candidate[] => [
  {
    kind: 'external',
    provider: 'tmdb',
    title,
    description: `desc de ${title}`,
    url: 'https://tmdb/x',
    image: 'https://img/x.jpg',
    tags: [],
    similarity: 1,
  },
];

async function startWith(titles: string) {
  const user = userEvent.setup();
  render(<BulkAddFlow categories={categories} />);
  await user.click(screen.getByText('pick-category'));
  await user.type(screen.getByRole('textbox'), titles);
  await user.click(screen.getByRole('button', { name: 'start' }));
  return user;
}

describe('BulkAddFlow (F4: carga masiva)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchCandidates.mockImplementation((_cat: string, title: string) =>
      Promise.resolve(candidatesFor(title)),
    );
    bulkAddItem.mockResolvedValue({ ok: true });
    bulkAddDone.mockResolvedValue(undefined);
  });

  it('procesa los títulos en orden y muestra candidatos del primero', async () => {
    await startWith('Dune\nAkira');
    // Título actual = primero.
    expect(await screen.findByRole('heading', { name: 'Dune' })).toBeInTheDocument();
    // Candidato de TMDB visible.
    expect(screen.getByText('desc de Dune')).toBeInTheDocument();
    // Se pidió búsqueda para el primero y prefetch del segundo.
    await waitFor(() =>
      expect(searchCandidates).toHaveBeenCalledWith('cat1', 'Akira'),
    );
  });

  it('elegir un candidato lo crea y avanza al siguiente título', async () => {
    const user = await startWith('Dune\nAkira');
    await screen.findByRole('heading', { name: 'Dune' });

    // Elegir el candidato TMDB del primer título.
    await user.click(screen.getByText('desc de Dune'));

    // Avanza a "Akira".
    expect(await screen.findByRole('heading', { name: 'Akira' })).toBeInTheDocument();
    expect(bulkAddItem).toHaveBeenCalledTimes(1);
    expect(bulkAddItem.mock.calls[0][1]).toMatchObject({ kind: 'external', title: 'Dune' });
  });

  it('omitir no crea nada y avanza; el resumen refleja creadas/omitidas', async () => {
    const user = await startWith('Dune\nAkira');
    await screen.findByRole('heading', { name: 'Dune' });

    // Dune: crear solo con el título.
    await user.click(screen.getByRole('button', { name: 'createScratch' }));
    await screen.findByRole('heading', { name: 'Akira' });
    // Akira: omitir.
    await user.click(screen.getByRole('button', { name: 'skip' }));

    // Resumen.
    expect(await screen.findByRole('heading', { name: 'summaryTitle' })).toBeInTheDocument();
    // 1 creada (scratch) + 1 omitida → bulkAddItem solo se llamó una vez.
    expect(bulkAddItem).toHaveBeenCalledTimes(1);
    expect(bulkAddItem.mock.calls[0][1]).toMatchObject({ kind: 'scratch', title: 'Dune' });

    // El botón final revalida y navega a la home.
    await user.click(screen.getByRole('button', { name: 'goHome' }));
    await waitFor(() => expect(bulkAddDone).toHaveBeenCalled());
    expect(push).toHaveBeenCalledWith('/');
  });
});
