import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecommendationCard, type CardItem } from './recommendation-card';

// Las acciones de servidor se mockean: aquí probamos render/interacción de UI.
vi.mock('@/lib/actions/interactions', () => ({
  setSaved: vi.fn(),
  setRating: vi.fn(),
}));

const item: CardItem = {
  id: 'r1',
  title: 'Blade Runner',
  description: 'Un blade runner persigue replicantes.',
  url: 'https://example.com/bladerunner',
  image_url: 'https://img.example.com/poster.jpg',
  global_score: 7,
  category: { name: 'Película', color: null, icon: 'Clapperboard' },
  tags: ['sci-fi', 'noir', 'culto'],
  state: { saved: false, rating: null },
};

// La vista ampliada se abre pulsando el TÍTULO de la fila (sin botón "más info").
async function openDetails(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Blade Runner' }));
  return screen.getByRole('dialog');
}

describe('RecommendationCard (F2: compacta ↔ ampliada)', () => {
  it('la fila compacta muestra el título pero NO descripción, tags ni imagen', () => {
    render(<RecommendationCard item={item} showScore />);
    expect(screen.getByText('Blade Runner')).toBeInTheDocument();
    expect(
      screen.queryByText('Un blade runner persigue replicantes.'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('noir')).not.toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });

  it('al pulsar el título abre la vista ampliada con descripción, tags, scoring e imagen', async () => {
    const user = userEvent.setup();
    render(<RecommendationCard item={item} showScore />);

    const dialog = await openDetails(user);
    expect(
      within(dialog).getByText('Un blade runner persigue replicantes.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('sci-fi')).toBeInTheDocument();
    expect(within(dialog).getByText('noir')).toBeInTheDocument();
    expect(within(dialog).getByText('culto')).toBeInTheDocument();
    // Scoring con label, abajo (el mock de i18n devuelve la clave 'score').
    expect(within(dialog).getByText(/score/)).toBeInTheDocument();
    expect(within(dialog).getByText('7')).toBeInTheDocument();
    // Imagen (póster) contenida sin recortes.
    const img = dialog.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('https://img.example.com/poster.jpg');
    expect(img?.className).toContain('object-contain');
  });

  it('el título de la vista ampliada enlaza a la URL en pestaña nueva', async () => {
    const user = userEvent.setup();
    render(<RecommendationCard item={item} showScore />);
    const dialog = await openDetails(user);
    const link = within(dialog).getByRole('link', { name: 'Blade Runner' });
    expect(link).toHaveAttribute('href', 'https://example.com/bladerunner');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('la vista ampliada se cierra con el botón cerrar (estética back-button)', async () => {
    const user = userEvent.setup();
    render(<RecommendationCard item={item} showScore />);
    await openDetails(user);
    const close = screen.getByRole('button', { name: 'close' });
    expect(close.className).toContain('back-button');
    await user.click(close);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sin imagen no renderiza <img> en la vista ampliada', async () => {
    const user = userEvent.setup();
    render(<RecommendationCard item={{ ...item, image_url: null }} showScore />);
    await openDetails(user);
    expect(screen.getByRole('dialog').querySelector('img')).toBeNull();
  });
});
