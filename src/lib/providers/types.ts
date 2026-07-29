import 'server-only';

// Candidato de contenido devuelto por un proveedor de búsqueda externa.
export type ExternalCandidate = {
  title: string;
  description?: string | null;
  url?: string | null;
  // URL pública del póster/carátula, si el proveedor la ofrece.
  image?: string | null;
  // Título del artículo de Wikipedia (lo aporta la IA): permite resolver la
  // imagen en el alta sin que el modelo invente URLs.
  wikiTitle?: string | null;
  tags?: string[];
  provider: string; // kind del proveedor (tmdb | steam | bgg | itunes | ai_*)
};

// Imagen resuelta + página de la que procede (artículo/ficha). La URL sirve
// como enlace de la tarjeta cuando la recomendación no tiene una propia.
export type ResolvedImage = {
  image: string;
  sourceUrl: string | null;
};

export type SearchOpts = {
  limit?: number;
  // Nombre de la categoría en el idioma del usuario (contexto para la IA).
  category?: string;
  // Nombre CANÓNICO de la categoría (columna categories.name): estable, lo usan
  // los proveedores que se comportan distinto según categoría (p. ej. iTunes
  // busca podcasts o artistas musicales).
  canonicalCategory?: string;
  // Idioma del usuario ('es' | 'en' | 'fr' | 'pt'): los proveedores que lo
  // soportan devuelven títulos y textos localizados (evita que un título
  // traducido puntúe 0 en la similitud).
  locale?: string;
  // Título exacto del artículo de Wikipedia, cuando lo aporta la IA. Solo lo
  // usa el proveedor de Wikipedia (a los demás les estorba: "Serial (podcast)"
  // busca peor que "Serial" en iTunes).
  wikiTitle?: string | null;
};

// Un proveedor puede saber buscar, resolver imágenes o ambas cosas. El registro
// en código (registry.ts) es la fuente de verdad de qué implementa cada uno; la
// tabla `providers` replica esas capacidades para la futura UI de admin.
export interface Provider {
  kind: string;
  // Variable de entorno necesaria; sin ella el proveedor se omite sin llamada.
  requiresKey?: string;
  isConfigured(): boolean;
  search?(query: string, opts?: SearchOpts): Promise<ExternalCandidate[]>;
  resolveImage?(title: string, opts?: SearchOpts): Promise<ResolvedImage | null>;
}

// Adaptador de búsqueda "clásico" (compatibilidad con el código existente).
export interface ProviderAdapter {
  kind: string;
  search(query: string, opts?: SearchOpts): Promise<ExternalCandidate[]>;
}

// Petición HTTP con timeout, sin lanzar nunca: devuelve null si falla o expira.
export async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  headers?: Record<string, string>,
): Promise<Response | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers });
    return res.ok ? res : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export const isHttpUrl = (v: unknown): v is string =>
  typeof v === 'string' && /^https?:\/\//.test(v);

// Deriva `resolveImage` de la búsqueda: pide un resultado y usa su imagen y su
// ficha. Sirve para todos los proveedores que ya devuelven imagen al buscar.
export function imageFromSearch(
  search: (query: string, opts?: SearchOpts) => Promise<ExternalCandidate[]>,
) {
  return async function resolveImage(
    title: string,
    opts?: SearchOpts,
  ): Promise<ResolvedImage | null> {
    const [hit] = await search(title, { ...opts, limit: 1 });
    if (!hit?.image || !isHttpUrl(hit.image)) return null;
    return { image: hit.image, sourceUrl: hit.url ?? null };
  };
}
