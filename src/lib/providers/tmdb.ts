import 'server-only';
import { PROVIDER_TIMEOUT_MS } from './config';
import {
  fetchWithTimeout,
  imageFromSearch,
  type ExternalCandidate,
  type Provider,
  type SearchOpts,
} from './types';

// TMDB search/multi (cine, TV). Requiere TMDB_API_KEY; si falta, se omite.
// Pide los textos en el idioma del usuario: si no, "El Padrino" devolvería
// "The Godfather" y la similitud tipográfica sería 0 pese a ser el acierto.
const TMDB_LANGS: Record<string, string> = {
  es: 'es-ES',
  en: 'en-US',
  fr: 'fr-FR',
  pt: 'pt-PT',
};

async function search(
  query: string,
  opts?: SearchOpts,
): Promise<ExternalCandidate[]> {
  const key = process.env.TMDB_API_KEY;
  if (!key) return [];
  const limit = opts?.limit ?? 8;
  const language = TMDB_LANGS[opts?.locale ?? 'en'] ?? 'en-US';

  const url =
    'https://api.themoviedb.org/3/search/multi?' +
    `query=${encodeURIComponent(query)}&include_adult=false&language=${language}&api_key=${key}`;
  const res = await fetchWithTimeout(url, PROVIDER_TIMEOUT_MS);
  if (!res) {
    // Visible en los logs de Vercel: sin esto un fallo de TMDB (key inválida,
    // bloqueo de red…) se confunde con "sin resultados".
    console.error('[tmdb] search failed');
    return [];
  }

  const data = (await res.json()) as {
    results?: Array<{
      id?: number;
      media_type?: string;
      title?: string;
      name?: string;
      overview?: string;
      poster_path?: string | null;
    }>;
  };
  const results = Array.isArray(data.results) ? data.results : [];
  return results
    .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
    .slice(0, limit)
    .map((r) => ({
      title: String(r.title ?? r.name ?? ''),
      description: r.overview ? String(r.overview) : null,
      url: `https://www.themoviedb.org/${r.media_type}/${r.id}`,
      image: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
      provider: 'tmdb',
    }))
    .filter((c) => c.title);
}

export const tmdbProvider: Provider = {
  kind: 'tmdb',
  requiresKey: 'TMDB_API_KEY',
  isConfigured: () => !!process.env.TMDB_API_KEY,
  search,
  resolveImage: imageFromSearch(search),
};
