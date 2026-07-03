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

  it('al pulsar "más info" abre la vista ampliada con descripción, tags e imagen', async () => {
    const user = userEvent.setup();
    render(<RecommendationCard item={item} showScore />);

    await user.click(screen.getByRole('button', { name: 'moreInfo' }));

    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText('Un blade runner persigue replicantes.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('sci-fi')).toBeInTheDocument();
    expect(within(dialog).getByText('noir')).toBeInTheDocument();
    expect(within(dialog).getByText('culto')).toBeInTheDocument();
    // Score visible en la ampliada.
    expect(within(dialog).getByText('7')).toBeInTheDocument();
    // Imagen (póster) presente.
    const img = dialog.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('https://img.example.com/poster.jpg');
  });

  it('la vista ampliada se cierra con el botón cerrar', async () => {
    const user = userEvent.setup();
    render(<RecommendationCard item={item} showScore />);
    await user.click(screen.getByRole('button', { name: 'moreInfo' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sin imagen no renderiza <img> en la vista ampliada', async () => {
    const user = userEvent.setup();
    render(<RecommendationCard item={{ ...item, image_url: null }} showScore />);
    await user.click(screen.getByRole('button', { name: 'moreInfo' }));
    expect(screen.getByRole('dialog').querySelector('img')).toBeNull();
  });
});
