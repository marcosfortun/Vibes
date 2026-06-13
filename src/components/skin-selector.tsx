'use client';

import { useTransition } from 'react';
import { Check } from 'lucide-react';
import { SKINS, type SkinStyle } from '@/lib/skins';
import { applySkin, storeSkin } from '@/lib/skin-client';
import { useActiveSkin } from '@/lib/use-active-skin';
import { updateSkin } from '@/lib/actions/preferences';
import { SkinPreviewCard } from '@/components/skin-preview-card';

export function SkinSelector({ current }: { current: SkinStyle }) {
  const [pending, startTransition] = useTransition();

  // Resaltado siempre sincronizado con la skin realmente activa.
  const active = useActiveSkin(current);

  function choose(style: SkinStyle) {
    if (style === active) return;
    // Persistencia local (sobrevive al logout) + aplicación optimista (dispara
    // el observer y actualiza el resaltado) + persistencia en BD.
    storeSkin(style);
    applySkin(style);
    startTransition(() => updateSkin(style));
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        {SKINS.map((skin) => {
          const isActive = skin.style === active;
          return (
            <button
              key={skin.style}
              type="button"
              disabled={pending}
              onClick={() => choose(skin.style)}
              aria-pressed={isActive}
              // data-skin: la tarjeta se renderiza con el tema de SU skin
              // (fondo, color de texto y tipografía propios de ese estilo).
              data-skin={skin.style}
              style={{
                background: 'var(--background)',
                color: 'var(--foreground)',
                fontFamily: 'var(--app-font)',
                borderColor: isActive
                  ? 'var(--accent-pink)'
                  : 'var(--border-muted)',
                borderWidth: isActive ? 2 : 1,
              }}
              className="flex items-center justify-between gap-3 rounded-2xl border p-3 text-left transition-colors disabled:opacity-60"
            >
              {/* Izquierda: nombre, estilo, icono y logo de la skin */}
              <span className="flex min-w-0 flex-col gap-2">
                <span className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-bold">{skin.name}</span>
                    {isActive && (
                      <Check size={16} className="shrink-0 text-neon-pink" />
                    )}
                  </span>
                  <span className="truncate text-xs text-muted">
                    {skin.style}
                  </span>
                </span>
                {/* Icono + logo de Vibes en la variante de marca de la skin. */}
                <span className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={skin.icon}
                    alt="Vibes"
                    className="h-9 w-9 shrink-0 rounded-lg object-cover"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={skin.logo}
                    alt="Vibes"
                    className="h-7 w-auto max-w-[120px] object-contain"
                  />
                </span>
              </span>

              {/* Derecha: mini-preview renderizada con el tema de la skin */}
              <span className="shrink-0">
                <SkinPreviewCard style={skin.style} />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
