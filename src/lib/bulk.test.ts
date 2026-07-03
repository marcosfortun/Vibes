import { describe, it, expect } from 'vitest';
import { parseTitles, MAX_TITLES } from './bulk';
import { LIMITS } from './limits';

describe('parseTitles (carga masiva)', () => {
  it('separa por líneas, recorta espacios y descarta vacías', () => {
    expect(parseTitles('  Matrix \n\n  Dune  \n   \nAkira')).toEqual([
      'Matrix',
      'Dune',
      'Akira',
    ]);
  });

  it('deduplica preservando el orden de primera aparición', () => {
    expect(parseTitles('Dune\nMatrix\nDune\nAkira\nmatrix')).toEqual([
      'Dune',
      'Matrix',
      'Akira',
      'matrix', // distinto case → título distinto (se dedup exacto)
    ]);
  });

  it('trunca cada título al límite de longitud', () => {
    const long = 'x'.repeat(LIMITS.title + 50);
    const [only] = parseTitles(long);
    expect(only).toHaveLength(LIMITS.title);
  });

  it('corta a MAX_TITLES títulos', () => {
    const many = Array.from({ length: MAX_TITLES + 20 }, (_, i) => `t${i}`).join('\n');
    expect(parseTitles(many)).toHaveLength(MAX_TITLES);
  });

  it('devuelve lista vacía si no hay títulos válidos', () => {
    expect(parseTitles('   \n\n  ')).toEqual([]);
  });
});
