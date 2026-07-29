// Configuración de la búsqueda externa y sus fallbacks. Punto único de ajuste:
// si mañana se cambia el modelo de IA o la fuente de imágenes, se toca aquí.

// Similitud mínima (0..1) para considerar bueno un resultado tipográfico. Se
// aplica al catálogo interno y a los proveedores especializados; los resultados
// del fallback de IA NO se filtran (su valor es semántico, no tipográfico:
// "true crime" → "Serial" es correcto y su similitud es ~0.14).
export const MIN_SIMILARITY = 0.35;

// Ventaja que se suma a los resultados del catálogo para que aparezcan arriba
// (se aplica DESPUÉS de filtrar: no rescata resultados por debajo del umbral).
export const CATALOG_BONUS = 0.1;

// Proveedor usado cuando ningún proveedor especializado da resultados válidos.
export const SEARCH_FALLBACK = 'ai_haiku_4.5';

// Proveedor usado como último recurso para imagen + URL de la ficha, cuando los
// proveedores de la categoría no la resuelven.
export const IMAGE_FALLBACK = 'wikipedia';

// Proveedores por categoría que se llegan a consultar (los primeros por posición).
export const MAX_PROVIDERS_PER_CATEGORY = 5;

// Resultados mostrados en el alta (incluye los del catálogo).
export const MAX_RESULTS = 10;

// Candidatos que se piden al modelo de fallback. Menos que MAX_RESULTS a
// propósito: el coste dominante de la llamada es generar tokens, así que pedir
// 6 en vez de 10 acorta bastante la única espera larga del flujo.
export const FALLBACK_RESULTS = 6;

// Presupuesto global de la búsqueda en paralelo: lo que no llegue a tiempo se
// descarta, pero los que sí respondieron valen (fallback solo si fallan todos).
export const PROVIDER_TIMEOUT_MS = 5000;

// Longitud mínima de la consulta para lanzar búsqueda (con menos, el ruido
// tipográfico dispara el fallback sin aportar nada).
export const MIN_QUERY_LENGTH = 3;

// Vida de la caché en memoria de resultados por (categoría, consulta).
export const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;

// Espera tras la última pulsación antes de buscar: cada búsqueda abre en
// paralelo hasta MAX_PROVIDERS_PER_CATEGORY llamadas externas.
export const SEARCH_DEBOUNCE_MS = 1000;
