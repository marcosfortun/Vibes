import 'server-only';
import type { ExternalCandidate, ProviderAdapter, SearchOpts } from './types';

// Steam storesearch (storefront público, sin API key). Devuelve juegos.
export const steamAdapter: ProviderAdapter = {
  kind: 'steam',
  async search(query: string, opts?: SearchOpts): Promise<ExternalCandidate[]> {
    const limit = opts?.limit ?? 8;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    try {
      const url =
        'https://store.steampowered.com/api/storesearch/?' +
        `term=${encodeURIComponent(query)}&l=english&cc=us`;
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) return [];
      const data = (await res.json()) as { items?: Array<{ id?: number; name?: string }> };
      const items = Array.isArray(data.items) ? data.items : [];
      return items
        .slice(0, limit)
        .map((it) => ({
          title: String(it.name ?? ''),
          description: null,
          url: it.id ? `https://store.steampowered.com/app/${it.id}` : null,
          provider: 'steam',
        }))
        .filter((c) => c.title);
    } finally {
      clearTimeout(timer);
    }
  },
};
