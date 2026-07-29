import { describe, it, expect } from 'vitest';
import { SKINS, DEFAULT_SKIN, skinFor, toSkinStyle, isSkinStyle } from './skins';

describe('skins (soporte PWA por skin)', () => {
  it('toda skin declara pwaIcon 512 y color de lienzo', () => {
    for (const s of SKINS) {
      expect(s.pwaIcon).toMatch(/^\/pwa\/icon-.*-512\.png$/);
      expect(s.canvas).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('skinFor devuelve la skin pedida', () => {
    expect(skinFor('pixel art').style).toBe('pixel art');
    expect(skinFor('minimal').name).toBe('Simple man');
  });

  it('skinFor cae a la primera skin si el estilo no existe', () => {
    // @ts-expect-error probando valor inválido a propósito
    expect(skinFor('hacker')).toBe(SKINS[0]);
  });

  it('toSkinStyle normaliza valores inválidos a la skin por defecto', () => {
    expect(toSkinStyle('pixel art')).toBe('pixel art');
    expect(toSkinStyle(null)).toBe(DEFAULT_SKIN);
    expect(toSkinStyle('inventada')).toBe(DEFAULT_SKIN);
  });

  it('isSkinStyle discrimina estilos válidos', () => {
    expect(isSkinStyle('neobrutalism')).toBe(true);
    expect(isSkinStyle('nope')).toBe(false);
  });
});
