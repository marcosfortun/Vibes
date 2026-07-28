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

// Steam storesearch (storefront público, sin API key). Devuelve juegos.
async function search(
  query: string,
  opts?: SearchOpts,
): Promise<ExternalCandidate[]> {
  const limit = opts?.limit ?? 8;
  const url =
    'https://store.steampowered.com/api/storesearch/?' +
    `term=${encodeURIComponent(query)}&l=english&cc=us`;
  const res = await fetchWithTimeout(url, PROVIDER_TIMEOUT_MS);
  if (!res) return [];

  const data = (await res.json()) as { items?: Array<{ id?: number; name?: string }> };
  const items = (Array.isArray(data.items) ? data.items : [])
    .filter((it) => it.id && it.name)
    .slice(0, limit);

  // storesearch no trae descripción → la pedimos a appdetails junto con la
  // carátula (header_image), en paralelo y best-effort.
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
}

async function steamDetails(
  appId: number,
): Promise<{ description: string | null; image: string | null }> {
  const res = await fetchWithTimeout(
    `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english&filters=basic`,
    PROVIDER_TIMEOUT_MS,
  );
  if (!res) return { description: null, image: null };
  try {
    const json = (await res.json()) as Record<
      string,
      { success?: boolean; data?: { short_description?: string; header_image?: string } }
    >;
    const data = json?.[String(appId)]?.data;
    const desc = data?.short_description;
    const img = data?.header_image;
    return {
      description: desc && desc.trim() ? desc : null,
      image: isHttpUrl(img) ? img : null,
    };
  } catch {
    return { description: null, image: null };
  }
}

export const steamProvider: Provider = {
  kind: 'steam',
  isConfigured: () => true, // storefront público
  search,
  resolveImage: imageFromSearch(search),
};
