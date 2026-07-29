import 'server-only';
import {
  IMAGE_FALLBACK,
  MAX_PROVIDERS_PER_CATEGORY,
  PROVIDER_TIMEOUT_MS,
  SEARCH_FALLBACK,
} from './config';
import { providerFor } from './registry';
import type { ExternalCandidate, ResolvedImage, SearchOpts } from './types';

// Orquestación de la búsqueda externa.
//
// Los proveedores de la categoría (máx. MAX_PROVIDERS_PER_CATEGORY, por orden
// de `position`) se consultan EN PARALELO con un presupuesto común: lo que no
// llegue a tiempo se descarta, pero los que sí respondieron cuentan. Los que no
// tienen su API key configurada se omiten sin llamada, de modo que una
// categoría sin proveedores utilizables no espera nada.
//
// Quien decide si hay que ir al fallback es el llamante (necesita aplicar antes
// el umbral de similitud): aquí solo se devuelve lo que dieron los proveedores.

export type ProviderSearchResult = {
  candidates: ExternalCandidate[];
  // Proveedores que llegaron a consultarse (con key y adaptador de búsqueda).
  usable: string[];
  // Orden de preferencia declarado en la categoría, para desempatar.
  order: Map<string, number>;
};

// Corta la espera a `ms` devolviendo lo que haya (nunca lanza).
function withBudget<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    p.then((v) => {
      clearTimeout(timer);
      resolve(v);
    }).catch(() => {
      clearTimeout(timer);
      resolve(fallback);
    });
  });
}

export async function searchProviders(
  providerKinds: string[],
  query: string,
  opts: SearchOpts,
): Promise<ProviderSearchResult> {
  const kinds = providerKinds.slice(0, MAX_PROVIDERS_PER_CATEGORY);
  const order = new Map(kinds.map((k, i) => [k, i]));

  const usableProviders = kinds
    .map((k) => providerFor(k))
    .filter((p): p is NonNullable<typeof p> => !!p?.search && p.isConfigured());

  if (!usableProviders.length) {
    return { candidates: [], usable: [], order };
  }

  const settled = await Promise.all(
    usableProviders.map((p) =>
      withBudget(
        p.search!(query, opts).catch(() => [] as ExternalCandidate[]),
        PROVIDER_TIMEOUT_MS,
        [] as ExternalCandidate[],
      ),
    ),
  );

  return {
    candidates: settled.flat(),
    usable: usableProviders.map((p) => p.kind),
    order,
  };
}

// Fallback de búsqueda (modelo de IA configurado en config.ts).
export async function searchFallback(
  query: string,
  opts: SearchOpts,
): Promise<ExternalCandidate[]> {
  const provider = providerFor(SEARCH_FALLBACK);
  if (!provider?.search || !provider.isConfigured()) return [];
  try {
    return await withBudget(
      provider.search(query, opts),
      PROVIDER_TIMEOUT_MS * 2, // el modelo es más lento que una API REST
      [],
    );
  } catch {
    return [];
  }
}

// Cadena de imagen para un contenido ya elegido (se ejecuta AL CREAR, una sola
// vez): proveedores de la categoría que sepan resolver imagen, por orden, y
// como último recurso el proveedor de imagen configurado (Wikipedia).
//
// Merece la pena reconsultar a los proveedores aunque la búsqueda no diera
// resultados: ahora se les pregunta por el título canónico del contenido
// elegido ("Radiolab") en vez de por lo que tecleó el usuario ("true crime").
export async function resolveImageFor(
  providerKinds: string[],
  title: string,
  opts: SearchOpts,
): Promise<ResolvedImage | null> {
  const chain = [...providerKinds.slice(0, MAX_PROVIDERS_PER_CATEGORY), IMAGE_FALLBACK];
  const seen = new Set<string>();

  for (const kind of chain) {
    if (seen.has(kind)) continue;
    seen.add(kind);
    const provider = providerFor(kind);
    if (!provider?.resolveImage || !provider.isConfigured()) continue;
    try {
      const found = await withBudget(
        provider.resolveImage(title, opts),
        PROVIDER_TIMEOUT_MS,
        null,
      );
      if (found?.image) return found;
    } catch {
      // Proveedor caído → siguiente eslabón.
    }
  }
  return null;
}
