import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_SKIN, skinFor, toSkinStyle } from '@/lib/skins';

// Manifest PWA dinámico: el nombre es siempre "Vibes" pero el icono y los
// colores son los de la skin activa (?skin=<style>; sin parámetro, la de
// por defecto). El <link rel="manifest"> lo reapunta el script de arranque
// del layout con la skin resuelta (BD → localStorage → por defecto), de modo
// que la app se instala con la identidad visual que el usuario está viendo.
// Limitación PWA: cambiar de skin después NO actualiza lo ya instalado (el
// sistema operativo cachea icono y nombre en el momento de la instalación).
export function GET(req: NextRequest) {
  const skin = skinFor(toSkinStyle(req.nextUrl.searchParams.get('skin') ?? DEFAULT_SKIN));

  return NextResponse.json(
    {
      name: 'Vibes',
      short_name: 'Vibes',
      description: 'Recomendaciones de ocio entre amigos',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: skin.canvas,
      theme_color: skin.canvas,
      icons: [
        {
          src: skin.pwaIcon,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
      ],
    },
    {
      headers: {
        'Content-Type': 'application/manifest+json',
        // Corto a propósito: la skin puede cambiar entre visitas.
        'Cache-Control': 'public, max-age=300',
      },
    },
  );
}
