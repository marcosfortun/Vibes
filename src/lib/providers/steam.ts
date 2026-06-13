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
      const items = (Array.isArray(data.items) ? data.items : [])
        .filter((it) => it.id && it.name)
        .slice(0, limit);

      // storesearch no trae descripción → la pedimos a appdetails (short_description),
      // en paralelo y best-effort: si una falla, ese candidato queda sin descripción.
      return Promise.all(
        items.map(async (it) => ({
          title: String(it.name),
          description: await steamShortDescription(it.id as number),
          url: `https://store.steampowered.com/app/${it.id}`,
          provider: 'steam',
        })),
      );
    } finally {
      clearTimeout(timer);
    }
  },
};

async function steamShortDescription(appId: number): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const url =
      'https://store.steampowered.com/api/appdetails?' +
      `appids=${appId}&l=english&filters=basic`;
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    const json = (await res.json()) as Record<
      string,
      { success?: boolean; data?: { short_description?: string } }
    >;
    const desc = json?.[String(appId)]?.data?.short_description;
    return desc && desc.trim() ? desc : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
