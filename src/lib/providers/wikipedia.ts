import 'server-only';
import { PROVIDER_TIMEOUT_MS } from './config';
import {
  fetchWithTimeout,
  isHttpUrl,
  type Provider,
  type ResolvedImage,
  type SearchOpts,
} from './types';

// Wikipedia (pageimages) como último recurso de imagen: cubre lo que ninguna
// fuente especializada alcanza (museos, rutas, festivales, expos…). Solo
// resuelve imagen; no participa en la búsqueda de resultados.
//
// Devuelve también la URL del artículo, que se usa como enlace de la tarjeta
// cuando la recomendación no tiene URL propia.
async function resolveImage(
  title: string,
  opts?: SearchOpts,
): Promise<ResolvedImage | null> {
  const locale = opts?.locale ?? 'en';
  // El título de artículo que aporta la IA es más preciso que el mostrado.
  const query = opts?.wikiTitle?.trim() || title;
  // Wiki del idioma del usuario y, si allí no hay imagen, la inglesa.
  const langs = [...new Set([/^(es|fr|pt)$/.test(locale) ? locale : 'en', 'en'])];

  for (const lang of langs) {
    const url =
      `https://${lang}.wikipedia.org/w/api.php?action=query&generator=search` +
      `&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1` +
      `&prop=pageimages&piprop=thumbnail&pithumbsize=640&redirects=1&format=json`;
    const res = await fetchWithTimeout(url, PROVIDER_TIMEOUT_MS);
    if (!res) continue;
    let data: {
      query?: {
        pages?: Record<string, { title?: string; thumbnail?: { source?: string } }>;
      };
    } | null = null;
    try {
      data = await res.json();
    } catch {
      continue;
    }
    const pages = data?.query?.pages;
    if (!pages) continue;
    const first = Object.values(pages)[0];
    if (isHttpUrl(first?.thumbnail?.source)) {
      const sourceUrl = first.title
        ? `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(
            first.title.replace(/ /g, '_'),
          )}`
        : null;
      return { image: first.thumbnail.source, sourceUrl };
    }
  }
  return null;
}

export const wikipediaProvider: Provider = {
  kind: 'wikipedia',
  isConfigured: () => true, // API pública
  resolveImage,
};
