import 'server-only';

// Candidato de contenido devuelto por un proveedor de búsqueda externa.
export type ExternalCandidate = {
  title: string;
  description?: string | null;
  url?: string | null;
  tags?: string[];
  provider: string; // kind del proveedor (tmdb | steam | ai)
};

export type SearchOpts = {
  limit?: number;
  category?: string; // nombre de la categoría (contexto para el proveedor IA)
};

// Adaptador de proveedor: dado un texto, devuelve candidatos. Nunca debe lanzar
// hacia arriba en uso normal; el orquestador igualmente captura errores.
export interface ProviderAdapter {
  kind: string;
  search(query: string, opts?: SearchOpts): Promise<ExternalCandidate[]>;
}
