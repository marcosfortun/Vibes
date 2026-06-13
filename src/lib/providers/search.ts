import 'server-only';
import type { ExternalCandidate, ProviderAdapter } from './types';
import { steamAdapter } from './steam';
import { tmdbAdapter } from './tmdb';
import { aiAdapter } from './ai';

const ADAPTERS: Record<string, ProviderAdapter> = {
  steam: steamAdapter,
  tmdb: tmdbAdapter,
  ai: aiAdapter,
};

// Orquesta la búsqueda externa: recorre los proveedores de la categoría por
// orden ascendente de `position` y devuelve los del PRIMERO que aporte
// resultados. Si todos fallan (o no hay), intenta IA como último recurso.
// Nunca lanza: si nada funciona, devuelve [] y la app sigue normal.
export async function externalSearch(args: {
  providerKinds: string[]; // en orden de position asc
  category: string;
  query: string;
  limit?: number;
}): Promise<ExternalCandidate[]> {
  const { providerKinds, category, query } = args;
  const limit = args.limit ?? 8;
  if (!query.trim()) return [];

  const tried = new Set<string>();
  for (const kind of providerKinds) {
    const adapter = ADAPTERS[kind];
    if (!adapter) continue;
    tried.add(kind);
    try {
      const out = await adapter.search(query, { limit, category });
      if (out.length) return out;
    } catch {
      // proveedor caído / sin resultados → siguiente
    }
  }

  if (!tried.has('ai')) {
    try {
      const out = await aiAdapter.search(query, { limit, category });
      if (out.length) return out;
    } catch {
      /* noop */
    }
  }
  return [];
}
