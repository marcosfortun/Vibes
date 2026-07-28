// Similitud tipográfica entre una consulta y el título de un resultado.
//
// Coeficiente de Dice sobre bigramas: parte cada texto en parejas de letras
// consecutivas ("matrix" → ma, at, tr, ri, ix) y calcula
// 2 × comunes / (total A + total B). Devuelve 0 (nada que ver) … 1 (idéntico).
// Tolera erratas ("intersteller" ≈ 0.82 con "Interstellar") pero no entiende
// idiomas: por eso los títulos traducidos se resuelven pidiendo a cada
// proveedor los datos en el idioma del usuario, no aquí.
//
// Sobre el Dice puro se añaden dos correcciones necesarias en la práctica:
//   - Normalización: minúsculas, sin acentos y sin puntuación, de forma que
//     "Sushi Go!" == "sushi go" y "Catán" == "catan".
//   - Suelo por contención: si un título contiene la consulta como palabra(s)
//     completa(s), la similitud es al menos 0.6. Sin esto, una consulta corta
//     contra un título largo puntúa bajísimo aunque sea el resultado correcto
//     ("catan" vs "Colonos de Catán" = 0.21 → 0.60).
const CONTAINMENT_FLOOR = 0.6;

export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function bigrams(s: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2));
  return out;
}

function dice(x: string, y: string): number {
  const bx = bigrams(x);
  const by = bigrams(y);
  if (!bx.length || !by.length) return x.includes(y) || y.includes(x) ? 0.5 : 0;
  const counts = new Map<string, number>();
  for (const g of bx) counts.set(g, (counts.get(g) ?? 0) + 1);
  let inter = 0;
  for (const g of by) {
    const c = counts.get(g) ?? 0;
    if (c > 0) {
      inter++;
      counts.set(g, c - 1);
    }
  }
  return (2 * inter) / (bx.length + by.length);
}

function containsAsWords(haystack: string, needle: string): boolean {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^| )${escaped}( |$)`).test(haystack);
}

export function similarity(a: string, b: string): number {
  const x = normalizeText(a);
  const y = normalizeText(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const d = dice(x, y);
  if (containsAsWords(y, x) || containsAsWords(x, y)) {
    return Math.max(d, CONTAINMENT_FLOOR);
  }
  return d;
}
