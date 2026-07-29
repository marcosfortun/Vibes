import 'server-only';
import { PROVIDER_TIMEOUT_MS } from './config';
import {
  fetchWithTimeout,
  imageFromSearch,
  isHttpUrl,
  type ExternalCandidate,
  type Provider,
  type SearchOpts,
} from './types';

// BoardGameGeek XML API2 (juegos de mesa). Desde finales de 2025 la API dejó de
// ser pública: exige registro y token Bearer, así que sin BGG_API_TOKEN el
// proveedor se omite. Registro: https://boardgamegeek.com/using_the_xml_api
//
// Dos llamadas: `search` (ids + nombres) y un único `thing` con todos los ids
// (descripción + imagen), para no disparar una petición por juego.
async function search(
  query: string,
  opts?: SearchOpts,
): Promise<ExternalCandidate[]> {
  const token = process.env.BGG_API_TOKEN;
  if (!token) return [];
  const limit = opts?.limit ?? 8;

  const searchXml = await bggFetch(
    `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`,
    token,
  );
  if (!searchXml) return [];

  const ids = [...searchXml.matchAll(/<item[^>]*\bid="(\d+)"/g)]
    .map((m) => m[1])
    .slice(0, limit);
  if (!ids.length) return [];

  const thingXml = await bggFetch(
    `https://boardgamegeek.com/xmlapi2/thing?id=${ids.join(',')}`,
    token,
  );
  if (!thingXml) return [];

  // El XML de `thing` trae un bloque <item> por juego, en el orden pedido.
  return thingXml
    .split('<item ')
    .slice(1)
    .map((block): ExternalCandidate | null => {
      const id = block.match(/\bid="(\d+)"/)?.[1];
      // El nombre principal es el de type="primary".
      const title = block.match(/<name[^>]*type="primary"[^>]*value="([^"]+)"/)?.[1];
      const image = block.match(/<image>\s*([^<\s][^<]*?)\s*<\/image>/)?.[1];
      const description = block.match(/<description>([\s\S]*?)<\/description>/)?.[1];
      if (!id || !title) return null;
      return {
        title: decodeXml(title),
        description: cleanDescription(description),
        url: `https://boardgamegeek.com/boardgame/${id}`,
        image: isHttpUrl(image) ? image : null,
        provider: 'bgg',
      };
    })
    .filter((c): c is ExternalCandidate => c !== null)
    .slice(0, limit);
}

async function bggFetch(url: string, token: string): Promise<string | null> {
  const res = await fetchWithTimeout(url, PROVIDER_TIMEOUT_MS, {
    Authorization: `Bearer ${token}`,
  });
  if (!res) {
    // 401 = token ausente/caducado: visible en los logs para diagnosticar.
    console.error('[bgg] request failed');
    return null;
  }
  try {
    return await res.text();
  } catch {
    return null;
  }
}

// El XML de BGG viene doble-escapado: las descripciones son HTML con entidades
// (&#10; como salto de línea, &aacute;…) que a su vez se escapan en el XML
// (&amp;#10;). De ahí las dos pasadas.
const NAMED: Record<string, string> = {
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>',
  nbsp: ' ',
  amp: '&', // el último en aplicarse dentro de cada pasada
};

function decodePass(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&([a-z]+);/gi, (m, name: string) => NAMED[name.toLowerCase()] ?? m);
}

function decodeXml(s: string): string {
  return decodePass(decodePass(s));
}

// Descripción larga y con saltos: nos quedamos con el primer párrafo útil.
function cleanDescription(raw?: string): string | null {
  if (!raw) return null;
  const text = decodeXml(raw).replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return text.length > 300 ? `${text.slice(0, 297)}…` : text;
}

export const bggProvider: Provider = {
  kind: 'bgg',
  requiresKey: 'BGG_API_TOKEN',
  isConfigured: () => !!process.env.BGG_API_TOKEN,
  search,
  resolveImage: imageFromSearch(search),
};
