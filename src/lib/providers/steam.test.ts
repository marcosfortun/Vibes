import { describe, it, expect, vi, afterEach } from 'vitest';
import { steamProvider } from './steam';

// Steam usa dos endpoints: storesearch (lista) y appdetails (descripción+imagen).
function mockSteam(detailsImage: string | null) {
  return vi.fn().mockImplementation((url: string) => {
    if (url.includes('storesearch')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ items: [{ id: 292030, name: 'The Witcher 3' }] }),
      });
    }
    // appdetails
    return Promise.resolve({
      ok: true,
      json: async () => ({
        '292030': {
          success: true,
          data: {
            short_description: 'Un RPG de mundo abierto.',
            header_image: detailsImage,
          },
        },
      }),
    });
  });
}

describe('steamProvider (búsqueda de videojuegos)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('extrae la carátula (header_image) y la descripción', async () => {
    vi.stubGlobal('fetch', mockSteam('https://cdn.steam/header.jpg'));
    const [c] = await steamProvider.search!('witcher');
    expect(c.title).toBe('The Witcher 3');
    expect(c.image).toBe('https://cdn.steam/header.jpg');
    expect(c.description).toContain('RPG');
    expect(c.url).toContain('store.steampowered.com/app/292030');
  });

  it('deja image en null si header_image no es una URL válida', async () => {
    vi.stubGlobal('fetch', mockSteam(null));
    const [c] = await steamProvider.search!('witcher');
    expect(c.image).toBeNull();
  });
});
