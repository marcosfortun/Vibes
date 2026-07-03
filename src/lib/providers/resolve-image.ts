import 'server-only';
import { steamAdapter } from './steam';
import { tmdbAdapter } from './tmdb';

// Resolución de imagen al CREAR una recomendación (alta simple y carga masiva)
// cuando el candidato no trae imagen propia (los de TMDB/Steam ya la traen).
// Devuelve también la URL de la fuente (artículo/ficha de donde sale la
// imagen): si la recomendación no tiene URL propia, se usa como enlace de la
// tarjeta (título e imagen clicables).
//
// Cascada best-effort, cada fuente con timeout corto y sin lanzar nunca:
//   1. Fuente especializada según la categoría (por su nombre canónico):
//      TMDB (cine/series/documental), Steam (videojuegos/VR), iTunes Search
//      (podcast y música; sin API key) y BoardGameGeek (juegos de mesa; sin
//      key). Va primero porque da la imagen "de ficha" (carátula/póster);
//      Wikipedia a veces devuelve fotos tangenciales (p. ej. para el podcast
//      Radiolab, la foto del presentador en vez de la carátula).
//   2. Wikipedia (pageimages) como fallback universal, usando el título del
//      artículo que devuelve la IA (wikiTitle) o, en su defecto, el propio
//      título. Wiki del idioma del usuario con fallback a la inglesa.
//   3. Nada → null: la tarjeta simplemente no muestra imagen.
// Se ejecuta en el momento del alta (1 sola resolución), nunca en el
// autocompletado (serían 8 por tecleo).

export type ResolvedImage = {
  image: string;
  // Página de la que procede la imagen (artículo de Wikipedia, ficha de
  // TMDB/Steam/iTunes/BGG). Puede faltar si la fuente no la expone.
  sourceUrl: string | null;
};

const TIMEOUT_MS = 4000;

async function fetchWithTimeout(url: string): Promise<Response | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return res.ok ? res : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetchWithTimeout(url);
  if (!res) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchText(url: string): Promise<string | null> {
  const res = await fetchWithTimeout(url);
  if (!res) return null;
  try {
    return await res.text();
  } catch {
    return null;
  }
}

const isHttpUrl = (v: unknown): v is string =>
  typeof v === 'string' && /^https?:\/\//.test(v);

// ── 2. Wikipedia: generator=search + pageimages en una sola llamada ──
async function wikipediaImage(
  title: string,
  locale: string,
): Promise<ResolvedImage | null> {
  const langs = [...new Set([/^(es|fr|pt)$/.test(locale) ? locale : 'en', 'en'])];
  for (const lang of langs) {
    const url =
      `https://${lang}.wikipedia.org/w/api.php?action=query&generator=search` +
      `&gsrsearch=${encodeURIComponent(title)}&gsrlimit=1` +
      `&prop=pageimages&piprop=thumbnail&pithumbsize=640&redirects=1&format=json`;
    const data = (await fetchJson(url)) as {
      query?: {
        pages?: Record<string, { title?: string; thumbnail?: { source?: string } }>;
      };
    } | null;
    const pages = data?.query?.pages;
    if (pages) {
      const first = Object.values(pages)[0];
      if (isHttpUrl(first?.thumbnail?.source)) {
        // URL canónica del artículo del que sale la imagen.
        const sourceUrl = first.title
          ? `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(
              first.title.replace(/ /g, '_'),
            )}`
          : null;
        return { image: first.thumbnail.source, sourceUrl };
      }
    }
  }
  return null;
}

// ── 1. iTunes Search (sin key): artwork de podcasts y música ──
async function itunesImage(
  term: string,
  kind: 'podcast' | 'music',
): Promise<ResolvedImage | null> {
  const filter = kind === 'podcast' ? 'media=podcast' : 'media=music&entity=album';
  const data = (await fetchJson(
    `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&${filter}&limit=1`,
  )) as {
    results?: Array<{ artworkUrl100?: string; collectionViewUrl?: string; trackViewUrl?: string }>;
  } | null;
  const hit = data?.results?.[0];
  const art = hit?.artworkUrl100;
  if (!isHttpUrl(art)) return null;
  const page = hit?.collectionViewUrl ?? hit?.trackViewUrl;
  return {
    // El artwork llega a 100px pero el CDN sirve cualquier tamaño solicitado.
    image: art.replace('100x100', '600x600'),
    sourceUrl: isHttpUrl(page) ? page : null,
  };
}

// ── 1. BoardGameGeek XML API2 (sin key): imagen de juegos de mesa ──
async function bggImage(title: string): Promise<ResolvedImage | null> {
  const search = await fetchText(
    `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(title)}&type=boardgame`,
  );
  const id = search?.match(/<item[^>]*\bid="(\d+)"/)?.[1];
  if (!id) return null;
  const thing = await fetchText(`https://boardgamegeek.com/xmlapi2/thing?id=${id}`);
  const img = thing?.match(/<image>\s*([^<\s][^<]*?)\s*<\/image>/)?.[1];
  if (!isHttpUrl(img)) return null;
  return { image: img, sourceUrl: `https://boardgamegeek.com/boardgame/${id}` };
}

// Nombre canónico de categoría (columna categories.name, estable) → fuente.
const TMDB_CATEGORIES = ['Película', 'Serie de televisión', 'Documental'];
const STEAM_CATEGORIES = ['Videojuego', 'Juego VR'];

async function specializedImage(
  title: string,
  categoryName: string,
): Promise<ResolvedImage | null> {
  try {
    if (TMDB_CATEGORIES.includes(categoryName)) {
      const [hit] = await tmdbAdapter.search(title, { limit: 1 });
      return hit?.image ? { image: hit.image, sourceUrl: hit.url ?? null } : null;
    }
    if (STEAM_CATEGORIES.includes(categoryName)) {
      const [hit] = await steamAdapter.search(title, { limit: 1 });
      return hit?.image ? { image: hit.image, sourceUrl: hit.url ?? null } : null;
    }
    if (categoryName === 'Podcast') return await itunesImage(title, 'podcast');
    if (categoryName === 'Grupo de música') return await itunesImage(title, 'music');
    if (categoryName === 'Juego de mesa') return await bggImage(title);
  } catch {
    // Fuente caída → seguir la cascada.
  }
  return null;
}

export async function resolveImage(args: {
  title: string;
  categoryName: string;
  locale: string;
  wikiTitle?: string | null;
}): Promise<ResolvedImage | null> {
  const { title, categoryName, locale, wikiTitle } = args;
  if (!title.trim()) return null;

  const viaSpecialized = await specializedImage(title, categoryName);
  if (viaSpecialized) return viaSpecialized;

  try {
    return await wikipediaImage(wikiTitle?.trim() || title, locale);
  } catch {
    return null;
  }
}
