import { LIMITS } from '@/lib/limits';

// Máximo de títulos procesables en una tanda de carga masiva.
export const MAX_TITLES = 50;

// Convierte el texto pegado (un título por línea) en la lista a procesar:
// recorta espacios, descarta vacíos, deduplica preservando el orden, aplica el
// límite de longitud por título y corta a MAX_TITLES.
export function parseTitles(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => l.slice(0, LIMITS.title)),
    ),
  ).slice(0, MAX_TITLES);
}
