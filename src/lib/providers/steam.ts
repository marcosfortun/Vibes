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

      // storesearch no trae descripción → la pedimos a appdetails junto con la
      // carátula (header_image), en paralelo y best-effort: si una falla, ese
      // candidato queda sin descripción/imagen.
      return Promise.all(
        items.map(async (it) => {
          const details = await steamDetails(it.id as number);
          return {
            title: String(it.name),
            description: details.description,
            url: `https://store.steampowered.com/app/${it.id}`,
            image: details.image,
            provider: 'steam',
          };
        }),
      );
    } finally {
      clearTimeout(timer);
    }
  },
};

async function steamDetails(
  appId: number,
): Promise<{ description: string | null; image: string | null }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const url =
      'https://store.steampowered.com/api/appdetails?' +
      `appids=${appId}&l=english&filters=basic`;
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return { description: null, image: null };
    const json = (await res.json()) as Record<
      string,
      { success?: boolean; data?: { short_description?: string; header_image?: string } }
    >;
    const data = json?.[String(appId)]?.data;
    const desc = data?.short_description;
    const img = data?.header_image;
    return {
      description: desc && desc.trim() ? desc : null,
      image: img && /^https?:\/\//.test(img) ? img : null,
    };
  } catch {
    return { description: null, image: null };
  } finally {
    clearTimeout(timer);
  }
}
