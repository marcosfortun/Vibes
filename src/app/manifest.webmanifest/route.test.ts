import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { skinFor, DEFAULT_SKIN } from '@/lib/skins';

async function manifestFor(skin?: string) {
  const url = skin
    ? `http://localhost/manifest.webmanifest?skin=${encodeURIComponent(skin)}`
    : 'http://localhost/manifest.webmanifest';
  const res = GET(new NextRequest(url));
  return res.json();
}

describe('manifest PWA dinámico por skin (F1)', () => {
  it('el nombre es siempre "Vibes" sea cual sea la skin', async () => {
    const def = await manifestFor();
    const pixel = await manifestFor('pixel art');
    expect(def.name).toBe('Vibes');
    expect(def.short_name).toBe('Vibes');
    expect(pixel.name).toBe('Vibes');
  });

  it('usa el icono y los colores de la skin pedida', async () => {
    const pixel = skinFor('pixel art');
    const m = await manifestFor('pixel art');
    expect(m.icons[0].src).toBe(pixel.pwaIcon);
    expect(m.icons[0].sizes).toBe('512x512');
    expect(m.theme_color).toBe(pixel.canvas);
    expect(m.background_color).toBe(pixel.canvas);
  });

  it('sin parámetro usa la skin por defecto', async () => {
    const def = skinFor(DEFAULT_SKIN);
    const m = await manifestFor();
    expect(m.icons[0].src).toBe(def.pwaIcon);
  });

  it('una skin inválida cae a la skin por defecto', async () => {
    const def = skinFor(DEFAULT_SKIN);
    const m = await manifestFor('hacker-2000');
    expect(m.icons[0].src).toBe(def.pwaIcon);
  });
});
