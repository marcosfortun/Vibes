import { describe, it, expect, vi, afterEach } from 'vitest';
import { resolveImage } from './resolve-image';

// Mock de fetch por patrón de URL: cada test define qué responde cada fuente.
type Route = { match: RegExp; body: unknown; text?: boolean; ok?: boolean };
function mockFetch(routes: Route[]) {
  const calls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      calls.push(url);
      const route = routes.find((r) => r.match.test(url));
      if (!route) return Promise.resolve({ ok: false });
      return Promise.resolve({
        ok: route.ok ?? true,
        json: async () => route.body,
        text: async () => String(route.body),
      });
    }),
  );
  return calls;
}

const WIKI_HIT = {
  query: { pages: { '1': { thumbnail: { source: 'https://wiki.img/serial.jpg' } } } },
};
const WIKI_MISS = { query: {} };

afterEach(() => vi.restoreAllMocks());

describe('resolveImage (F5: imagen para resultados de IA)', () => {
  it('categoría sin fuente especializada → Wikipedia con el wikiTitle de la IA', async () => {
    const calls = mockFetch([{ match: /es\.wikipedia\.org/, body: WIKI_HIT }]);
    const img = await resolveImage({
      title: 'Museo del Prado',
      categoryName: 'Museo',
      locale: 'es',
      wikiTitle: 'Museo Nacional del Prado',
    });
    expect(img).toBe('https://wiki.img/serial.jpg');
    expect(calls[0]).toContain('gsrsearch=Museo%20Nacional%20del%20Prado');
  });

  it('si la wiki del idioma no tiene imagen, prueba la inglesa', async () => {
    mockFetch([
      { match: /es\.wikipedia\.org/, body: WIKI_MISS },
      { match: /en\.wikipedia\.org/, body: WIKI_HIT },
    ]);
    const img = await resolveImage({
      title: 'Serial',
      categoryName: 'Expo',
      locale: 'es',
    });
    expect(img).toBe('https://wiki.img/serial.jpg');
  });

  it('podcast: iTunes tiene prioridad sobre Wikipedia (carátula > foto tangencial)', async () => {
    const calls = mockFetch([
      { match: /wikipedia\.org/, body: WIKI_HIT },
      {
        match: /itunes\.apple\.com\/search.*media=podcast/,
        body: { results: [{ artworkUrl100: 'https://cdn.itunes/art/100x100bb.jpg' }] },
      },
    ]);
    const img = await resolveImage({
      title: 'Radiolab',
      categoryName: 'Podcast',
      locale: 'en',
    });
    // Artwork de iTunes ampliado a 600px, y sin tocar Wikipedia.
    expect(img).toBe('https://cdn.itunes/art/600x600bb.jpg');
    expect(calls.some((u) => u.includes('wikipedia.org'))).toBe(false);
  });

  it('si la especializada no da resultado, cae a Wikipedia', async () => {
    mockFetch([
      { match: /itunes\.apple\.com/, body: { results: [] } },
      { match: /en\.wikipedia\.org/, body: WIKI_HIT },
    ]);
    const img = await resolveImage({
      title: 'Un podcast rarísimo',
      categoryName: 'Podcast',
      locale: 'en',
    });
    expect(img).toBe('https://wiki.img/serial.jpg');
  });

  it('juego de mesa: BoardGameGeek (búsqueda + ficha XML)', async () => {
    mockFetch([
      {
        match: /boardgamegeek\.com\/xmlapi2\/search/,
        body: '<items><item type="boardgame" id="13"><name value="Catan"/></item></items>',
      },
      {
        match: /boardgamegeek\.com\/xmlapi2\/thing/,
        body: '<items><item id="13"><image>https://cf.geekdo/catan.jpg</image></item></items>',
      },
    ]);
    const img = await resolveImage({
      title: 'Catan',
      categoryName: 'Juego de mesa',
      locale: 'es',
    });
    expect(img).toBe('https://cf.geekdo/catan.jpg');
  });

  it('cine: TMDB reutilizando el adaptador', async () => {
    mockFetch([
      {
        match: /api\.themoviedb\.org/,
        body: {
          results: [
            { id: 1, media_type: 'movie', title: 'Enemy', poster_path: '/enemy.jpg' },
          ],
        },
      },
    ]);
    vi.stubEnv('TMDB_API_KEY', 'k');
    const img = await resolveImage({
      title: 'Enemy',
      categoryName: 'Película',
      locale: 'es',
    });
    expect(img).toBe('https://image.tmdb.org/t/p/w500/enemy.jpg');
    vi.unstubAllEnvs();
  });

  it('si ninguna fuente responde, devuelve null (sin lanzar)', async () => {
    mockFetch([]); // todo falla
    const img = await resolveImage({
      title: 'Algo rarísimo',
      categoryName: 'Museo',
      locale: 'fr',
    });
    expect(img).toBeNull();
  });

  it('con título vacío no llama a ninguna fuente', async () => {
    const calls = mockFetch([]);
    expect(
      await resolveImage({ title: '  ', categoryName: 'Podcast', locale: 'es' }),
    ).toBeNull();
    expect(calls).toHaveLength(0);
  });
});
