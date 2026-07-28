import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ExternalCandidate, Provider, ResolvedImage } from './types';

// Proveedores de mentira: el registro real se sustituye por estos para poder
// probar la orquestación (paralelismo, presupuesto, cadena de imagen).
const calls: string[] = [];
function fakeProvider(
  kind: string,
  opts: {
    results?: ExternalCandidate[];
    image?: ResolvedImage | null;
    delayMs?: number;
    configured?: boolean;
    throws?: boolean;
  } = {},
): Provider {
  return {
    kind,
    isConfigured: () => opts.configured ?? true,
    search: async () => {
      calls.push(`search:${kind}`);
      if (opts.throws) throw new Error('boom');
      if (opts.delayMs) await new Promise((r) => setTimeout(r, opts.delayMs));
      return opts.results ?? [];
    },
    resolveImage: opts.image !== undefined
      ? async () => {
          calls.push(`image:${kind}`);
          return opts.image ?? null;
        }
      : undefined,
  };
}

const registry = new Map<string, Provider>();
vi.mock('./registry', () => ({
  providerFor: (kind: string) => registry.get(kind),
}));

const candidate = (title: string, provider: string): ExternalCandidate => ({
  title,
  description: null,
  url: null,
  image: null,
  provider,
});

let searchProviders: typeof import('./search').searchProviders;
let searchFallback: typeof import('./search').searchFallback;
let resolveImageFor: typeof import('./search').resolveImageFor;

beforeEach(async () => {
  calls.length = 0;
  registry.clear();
  vi.useRealTimers();
  ({ searchProviders, searchFallback, resolveImageFor } = await import('./search'));
});

afterEach(() => vi.restoreAllMocks());

describe('searchProviders (abanico en paralelo)', () => {
  it('mezcla los resultados de todos los proveedores de la categoría', async () => {
    registry.set('tmdb', fakeProvider('tmdb', { results: [candidate('A', 'tmdb')] }));
    registry.set('steam', fakeProvider('steam', { results: [candidate('B', 'steam')] }));

    const res = await searchProviders(['tmdb', 'steam'], 'q', {});

    expect(res.candidates.map((c) => c.title).sort()).toEqual(['A', 'B']);
    expect(res.usable.sort()).toEqual(['steam', 'tmdb']);
    // El orden declarado se conserva para desempatar.
    expect(res.order.get('tmdb')).toBe(0);
    expect(res.order.get('steam')).toBe(1);
  });

  it('omite sin llamada a los proveedores sin API key', async () => {
    registry.set('bgg', fakeProvider('bgg', { configured: false }));
    registry.set('steam', fakeProvider('steam', { results: [candidate('B', 'steam')] }));

    const res = await searchProviders(['bgg', 'steam'], 'q', {});

    expect(calls).toEqual(['search:steam']);
    expect(res.usable).toEqual(['steam']);
  });

  it('sin proveedores utilizables no espera nada', async () => {
    registry.set('bgg', fakeProvider('bgg', { configured: false }));
    const res = await searchProviders(['bgg'], 'q', {});
    expect(res).toMatchObject({ candidates: [], usable: [] });
    expect(calls).toEqual([]);
  });

  it('un proveedor que falla no tumba a los demás (éxito parcial)', async () => {
    registry.set('tmdb', fakeProvider('tmdb', { throws: true }));
    registry.set('steam', fakeProvider('steam', { results: [candidate('B', 'steam')] }));

    const res = await searchProviders(['tmdb', 'steam'], 'q', {});
    expect(res.candidates.map((c) => c.title)).toEqual(['B']);
  });

  it('respeta el máximo de proveedores por categoría', async () => {
    for (const k of ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']) {
      registry.set(k, fakeProvider(k, { results: [candidate(k, k)] }));
    }
    const res = await searchProviders(['p1', 'p2', 'p3', 'p4', 'p5', 'p6'], 'q', {});
    expect(res.usable).toHaveLength(5);
    expect(res.usable).not.toContain('p6');
  });
});

describe('searchFallback', () => {
  it('usa el proveedor de fallback configurado', async () => {
    registry.set(
      'ai_haiku_4.5',
      fakeProvider('ai_haiku_4.5', { results: [candidate('Serial', 'ai_haiku_4.5')] }),
    );
    const out = await searchFallback('true crime', {});
    expect(out.map((c) => c.title)).toEqual(['Serial']);
  });

  it('sin API key devuelve vacío sin llamar', async () => {
    registry.set('ai_haiku_4.5', fakeProvider('ai_haiku_4.5', { configured: false }));
    expect(await searchFallback('q', {})).toEqual([]);
    expect(calls).toEqual([]);
  });
});

describe('resolveImageFor (cadena de imagen)', () => {
  const IMG = { image: 'https://img/x.jpg', sourceUrl: 'https://ficha/x' };

  it('usa el primer proveedor de la categoría que resuelva', async () => {
    registry.set('itunes', fakeProvider('itunes', { image: IMG }));
    registry.set('wikipedia', fakeProvider('wikipedia', { image: { image: 'https://wiki/x.jpg', sourceUrl: null } }));

    expect(await resolveImageFor(['itunes'], 'Radiolab', {})).toEqual(IMG);
    // Wikipedia no llega a consultarse.
    expect(calls).toEqual(['image:itunes']);
  });

  it('cae a Wikipedia si los proveedores no resuelven', async () => {
    registry.set('itunes', fakeProvider('itunes', { image: null }));
    const wiki = { image: 'https://wiki/x.jpg', sourceUrl: 'https://es.wikipedia.org/wiki/X' };
    registry.set('wikipedia', fakeProvider('wikipedia', { image: wiki }));

    expect(await resolveImageFor(['itunes'], 'Algo', {})).toEqual(wiki);
    expect(calls).toEqual(['image:itunes', 'image:wikipedia']);
  });

  it('salta a los proveedores que solo saben buscar', async () => {
    registry.set('ai_haiku_4.5', fakeProvider('ai_haiku_4.5')); // sin resolveImage
    registry.set('wikipedia', fakeProvider('wikipedia', { image: IMG }));

    expect(await resolveImageFor(['ai_haiku_4.5'], 'X', {})).toEqual(IMG);
    expect(calls).toEqual(['image:wikipedia']);
  });

  it('devuelve null si nadie resuelve', async () => {
    registry.set('wikipedia', fakeProvider('wikipedia', { image: null }));
    expect(await resolveImageFor([], 'X', {})).toBeNull();
  });
});
