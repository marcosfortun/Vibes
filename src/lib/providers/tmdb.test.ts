import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tmdbProvider } from './tmdb';

// Respuesta mínima de TMDB search/multi con un resultado de cine con póster.
const TMDB_OK = {
  results: [
    {
      id: 603,
      media_type: 'movie',
      title: 'The Matrix',
      overview: 'A hacker learns the truth.',
      poster_path: '/aaa.jpg',
    },
    { id: 1, media_type: 'person', name: 'Keanu' }, // se debe filtrar
  ],
};

describe('tmdbProvider (búsqueda de cine/series)', () => {
  beforeEach(() => {
    vi.stubEnv('TMDB_API_KEY', 'test-key');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('mapea el poster_path a una URL absoluta de imagen', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => TMDB_OK }),
    );
    const out = await tmdbProvider.search!('matrix');
    expect(out).toHaveLength(1); // person filtrado
    expect(out[0].title).toBe('The Matrix');
    expect(out[0].image).toBe('https://image.tmdb.org/t/p/w500/aaa.jpg');
    expect(out[0].url).toContain('themoviedb.org/movie/603');
  });

  it('deja image en null si el resultado no trae póster', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [{ id: 7, media_type: 'tv', name: 'Sin póster', poster_path: null }],
        }),
      }),
    );
    const [c] = await tmdbProvider.search!('algo');
    expect(c.image).toBeNull();
  });

  it('sin TMDB_API_KEY no llama a la red y devuelve []', async () => {
    vi.unstubAllEnvs();
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    expect(await tmdbProvider.search!('matrix')).toEqual([]);
    expect(f).not.toHaveBeenCalled();
  });
});
