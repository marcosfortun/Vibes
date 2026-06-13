import 'server-only';
import type { ExternalCandidate, ProviderAdapter, SearchOpts } from './types';

// TMDB search/multi (cine, TV). Requiere TMDB_API_KEY; si falta, se omite.
export const tmdbAdapter: ProviderAdapter = {
  kind: 'tmdb',
  async search(query: string, opts?: SearchOpts): Promise<ExternalCandidate[]> {
    const key = process.env.TMDB_API_KEY;
    if (!key) return [];
    const limit = opts?.limit ?? 8;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    try {
      const url =
        'https://api.themoviedb.org/3/search/multi?' +
        `query=${encodeURIComponent(query)}&include_adult=false&language=en-US&api_key=${key}`;
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) return [];
      const data = (await res.json()) as {
        results?: Array<{
          id?: number;
          media_type?: string;
          title?: string;
          name?: string;
          overview?: string;
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
          provider: 'tmdb',
        }))
        .filter((c) => c.title);
    } finally {
      clearTimeout(timer);
    }
  },
};
