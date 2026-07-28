import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { PROVIDERS, capabilitiesOf, providerFor } from './registry';
import { IMAGE_FALLBACK, SEARCH_FALLBACK } from './config';

// El comportamiento lo define el registro en código, pero la tabla `providers`
// replica las capacidades para la futura UI de admin. Este test falla si las
// dos fuentes se desincronizan (p. ej. se añade un adaptador y no se registra
// en la migración, o al revés).
const MIGRATION = 'supabase/migrations/20260728120000_providers_refactor.sql';

function kindsInList(sql: string, column: string): Set<string> {
  const re = new RegExp(`${column}\\s*=\\s*kind in \\(([^)]*)\\)`);
  const raw = sql.match(re)?.[1] ?? '';
  return new Set([...raw.matchAll(/'([^']+)'/g)].map((m) => m[1]));
}

describe('registro de proveedores ↔ catálogo en BD', () => {
  const sql = readFileSync(MIGRATION, 'utf8');

  it('cada proveedor del código está en el catálogo de la migración', () => {
    for (const p of PROVIDERS) {
      expect(sql, `falta ${p.kind} en la migración`).toContain(`'${p.kind}'`);
    }
  });

  it('las capacidades declaradas coinciden con las de la BD', () => {
    const canSearch = kindsInList(sql, 'can_search');
    const canResolveImage = kindsInList(sql, 'can_resolve_image');

    for (const p of PROVIDERS) {
      const caps = capabilitiesOf(p);
      expect(canSearch.has(p.kind), `can_search de ${p.kind}`).toBe(caps.can_search);
      expect(canResolveImage.has(p.kind), `can_resolve_image de ${p.kind}`).toBe(
        caps.can_resolve_image,
      );
    }
    // Y a la inversa: nada en BD que el código no implemente.
    for (const kind of [...canSearch, ...canResolveImage]) {
      expect(providerFor(kind), `${kind} no existe en el registro`).toBeDefined();
    }
  });

  it('la clave requerida de cada proveedor coincide con la migración', () => {
    for (const p of PROVIDERS) {
      const caps = capabilitiesOf(p);
      if (!caps.requires_key) continue;
      expect(sql).toMatch(
        new RegExp(`when '${p.kind}'\\s*then '${caps.requires_key}'`),
      );
    }
  });

  it('los fallbacks configurados existen y saben hacer su trabajo', () => {
    const search = providerFor(SEARCH_FALLBACK);
    expect(search?.search, `${SEARCH_FALLBACK} debe saber buscar`).toBeTypeOf('function');

    const image = providerFor(IMAGE_FALLBACK);
    expect(
      image?.resolveImage,
      `${IMAGE_FALLBACK} debe saber resolver imágenes`,
    ).toBeTypeOf('function');
  });

  it('no hay identificadores duplicados', () => {
    const kinds = PROVIDERS.map((p) => p.kind);
    expect(new Set(kinds).size).toBe(kinds.length);
  });
});
