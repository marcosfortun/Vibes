import { describe, it, expect } from 'vitest';
import { similarity, normalizeText } from './similarity';
import { MIN_SIMILARITY } from './providers/config';

describe('similarity (umbral de relevancia)', () => {
  it('normaliza mayúsculas, acentos y puntuación', () => {
    expect(normalizeText('  Sushi Go!  ')).toBe('sushi go');
    expect(normalizeText('Catán')).toBe('catan');
    expect(similarity('sushi go', 'Sushi Go!')).toBe(1);
    expect(similarity('catan', 'Catán')).toBe(1);
  });

  it('tolera erratas', () => {
    expect(similarity('intersteller', 'Interstellar')).toBeGreaterThan(0.7);
  });

  it('rescata consultas cortas contenidas en títulos largos (suelo 0.6)', () => {
    // Sin el suelo por contención, estos casos caían por debajo del umbral
    // pese a ser el acierto (0.21, 0.41 y 0.38 con Dice puro).
    for (const [q, r] of [
      ['catan', 'Colonos de Catán'],
      ['witcher', 'The Witcher 3: Wild Hunt'],
      ['dune', 'Dune: Part Two'],
    ]) {
      expect(similarity(q, r), `${q} vs ${r}`).toBeGreaterThanOrEqual(0.6);
    }
  });

  it('descarta resultados sin relación', () => {
    for (const [q, r] of [
      ['true crime', 'Serial'],
      ['zelda', 'Hollow Knight'],
      ['crimen', 'Museo del Prado'],
    ]) {
      expect(similarity(q, r), `${q} vs ${r}`).toBeLessThan(MIN_SIMILARITY);
    }
  });

  it('los aciertos legítimos superan el umbral configurado', () => {
    for (const [q, r] of [
      ['matrix', 'The Matrix'],
      ['blade runner', 'Blade Runner 2049'],
      ['radiolab', 'Radiolab'],
      ['mobile world congress', 'Mobile World Congress'],
    ]) {
      expect(similarity(q, r), `${q} vs ${r}`).toBeGreaterThanOrEqual(MIN_SIMILARITY);
    }
  });

  it('es simétrica y acotada a 0..1', () => {
    expect(similarity('matrix', 'The Matrix')).toBeCloseTo(
      similarity('The Matrix', 'matrix'),
    );
    expect(similarity('', 'algo')).toBe(0);
    expect(similarity('igual', 'igual')).toBe(1);
  });
});
