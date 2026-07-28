import 'server-only';
import { PROVIDER_TIMEOUT_MS } from './config';
import {
  fetchWithTimeout,
  isHttpUrl,
  type ExternalCandidate,
  type Provider,
  type ResolvedImage,
  type SearchOpts,
} from './types';

// iTunes Search API (pública, sin API key): podcasts y música.
//
// Se comporta distinto según la categoría canónica:
//   - "Podcast"          → fichas de podcast (carátula y enlace de la ficha).
//   - "Grupo de música"  → artistas (nombre y enlace); el artista no trae
//     imagen en esta API, así que para la imagen se busca uno de sus álbumes.
const MUSIC_CATEGORY = 'Grupo de música';

type ItunesResult = {
  collectionName?: string;
  trackName?: string;
  artistName?: string;
  artworkUrl100?: string;
  collectionViewUrl?: string;
  trackViewUrl?: string;
  artistViewUrl?: string;
  artistLinkUrl?: string;
};

async function itunesSearch(params: string): Promise<ItunesResult[]> {
  const res = await fetchWithTimeout(
    `https://itunes.apple.com/search?${params}`,
    PROVIDER_TIMEOUT_MS,
  );
  if (!res) return [];
  try {
    const data = (await res.json()) as { results?: ItunesResult[] };
    return Array.isArray(data.results) ? data.results : [];
  } catch {
    return [];
  }
}

// El artwork llega a 100px pero el CDN sirve cualquier tamaño solicitado.
const bigArtwork = (url?: string) =>
  isHttpUrl(url) ? url.replace('100x100', '600x600') : null;

async function search(
  query: string,
  opts?: SearchOpts,
): Promise<ExternalCandidate[]> {
  const limit = opts?.limit ?? 8;
  const isMusic = opts?.canonicalCategory === MUSIC_CATEGORY;
  const term = encodeURIComponent(query);

  if (isMusic) {
    const rows = await itunesSearch(`term=${term}&media=music&entity=musicArtist&limit=${limit}`);
    return rows
      .filter((r) => r.artistName)
      .map((r) => ({
        title: String(r.artistName),
        description: null,
        url: isHttpUrl(r.artistLinkUrl)
          ? r.artistLinkUrl
          : isHttpUrl(r.artistViewUrl)
            ? r.artistViewUrl
            : null,
        image: null, // los artistas no traen artwork; lo resuelve resolveImage
        provider: 'itunes',
      }));
  }

  const rows = await itunesSearch(`term=${term}&media=podcast&limit=${limit}`);
  return rows
    .filter((r) => r.collectionName)
    .map((r) => ({
      title: String(r.collectionName),
      description: r.artistName ? String(r.artistName) : null,
      url: isHttpUrl(r.collectionViewUrl) ? r.collectionViewUrl : null,
      image: bigArtwork(r.artworkUrl100),
      provider: 'itunes',
    }));
}

async function resolveImage(
  title: string,
  opts?: SearchOpts,
): Promise<ResolvedImage | null> {
  const term = encodeURIComponent(title);
  const isMusic = opts?.canonicalCategory === MUSIC_CATEGORY;
  // Para un grupo, la portada de uno de sus álbumes es la mejor imagen
  // disponible en esta API.
  const params = isMusic
    ? `term=${term}&media=music&entity=album&limit=1`
    : `term=${term}&media=podcast&limit=1`;
  const [hit] = await itunesSearch(params);
  const image = bigArtwork(hit?.artworkUrl100);
  if (!image) return null;
  const page = isMusic
    ? (hit?.artistViewUrl ?? hit?.collectionViewUrl)
    : (hit?.collectionViewUrl ?? hit?.trackViewUrl);
  return { image, sourceUrl: isHttpUrl(page) ? page : null };
}

export const itunesProvider: Provider = {
  kind: 'itunes',
  isConfigured: () => true, // API pública
  search,
  resolveImage,
};
