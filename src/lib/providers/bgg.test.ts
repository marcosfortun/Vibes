import { describe, it, expect, vi, afterEach } from 'vitest';
import { bggAdapter } from './bgg';

const SEARCH_XML = `<?xml version="1.0"?>
<items total="2">
  <item type="boardgame" id="13"><name type="primary" value="Catan"/></item>
  <item type="boardgame" id="325"><name type="primary" value="Catan: Seafarers"/></item>
</items>`;

const THING_XML = `<?xml version="1.0"?>
<items>
  <item type="boardgame" id="13">
    <thumbnail>https://cf.geekdo/t/catan.jpg</thumbnail>
    <image>https://cf.geekdo/catan.jpg</image>
    <name type="primary" sortindex="1" value="Catan"/>
    <description>Comercia &amp;amp; construye en la isla de Catán.&amp;#10;&amp;#10;De 3 a 4 jugadores.</description>
  </item>
  <item type="boardgame" id="325">
    <image>https://cf.geekdo/seafarers.jpg</image>
    <name type="primary" sortindex="1" value="Catan: Seafarers"/>
    <description>Expansión náutica.</description>
  </item>
</items>`;

function mockBgg(routes: { search?: string; thing?: string; status?: number }) {
  const headers: Array<Record<string, string> | undefined> = [];
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, init?: { headers?: Record<string, string> }) => {
      headers.push(init?.headers);
      if (routes.status) return Promise.resolve({ ok: false, status: routes.status });
      const body = url.includes('/search') ? routes.search : routes.thing;
      return Promise.resolve({ ok: body !== undefined, text: async () => body ?? '' });
    }),
  );
  return headers;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('bggAdapter (proveedor de búsqueda para juegos de mesa)', () => {
  it('sin BGG_API_TOKEN no llama a la red y devuelve []', async () => {
    vi.stubEnv('BGG_API_TOKEN', '');
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    expect(await bggAdapter.search('catan')).toEqual([]);
    expect(f).not.toHaveBeenCalled();
  });

  it('devuelve candidatos con título, descripción, imagen y ficha', async () => {
    vi.stubEnv('BGG_API_TOKEN', 'tok');
    const headers = mockBgg({ search: SEARCH_XML, thing: THING_XML });

    const out = await bggAdapter.search('catan');

    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({
      title: 'Catan',
      image: 'https://cf.geekdo/catan.jpg',
      url: 'https://boardgamegeek.com/boardgame/13',
      provider: 'bgg',
    });
    // Doble escapado del XML de BGG resuelto y descripción en una línea.
    expect(out[0].description).toContain('Comercia & construye en la isla de Catán.');
    expect(out[0].description).not.toContain('&#10;');
    expect(out[0].description).not.toContain('\n');
    expect(out[1].title).toBe('Catan: Seafarers');
    // Ambas peticiones autenticadas (la API exige token desde 2026).
    expect(headers[0]).toEqual({ Authorization: 'Bearer tok' });
    expect(headers[1]).toEqual({ Authorization: 'Bearer tok' });
  });

  it('respeta el límite pedido', async () => {
    vi.stubEnv('BGG_API_TOKEN', 'tok');
    mockBgg({ search: SEARCH_XML, thing: THING_XML });
    const out = await bggAdapter.search('catan', { limit: 1 });
    expect(out).toHaveLength(1);
  });

  it('con token inválido (401) devuelve [] sin lanzar', async () => {
    vi.stubEnv('BGG_API_TOKEN', 'caducado');
    mockBgg({ status: 401 });
    expect(await bggAdapter.search('catan')).toEqual([]);
  });

  it('búsqueda sin resultados → [] sin pedir la ficha', async () => {
    vi.stubEnv('BGG_API_TOKEN', 'tok');
    const headers = mockBgg({ search: '<items total="0"></items>' });
    expect(await bggAdapter.search('zzzz')).toEqual([]);
    expect(headers).toHaveLength(1); // solo la búsqueda
  });
});
