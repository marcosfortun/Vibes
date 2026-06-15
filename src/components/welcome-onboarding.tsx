'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { SKINS, DEFAULT_SKIN, type SkinStyle } from '@/lib/skins';
import { applySkin, storeSkin } from '@/lib/skin-client';
import { finishOnboarding } from '@/lib/actions/auth';
import { SkinPreviewCard } from '@/components/skin-preview-card';

// Paso final del alta: el usuario elige su skin (Stick stack preseleccionada).
// La elección se aplica al instante (data-skin en <html>) y se persiste al
// continuar vía finishOnboarding (guarda en BD + envía la bienvenida).
export function WelcomeOnboarding({ next }: { next: string }) {
  const t = useTranslations('Welcome');
  const [selected, setSelected] = useState<SkinStyle>(DEFAULT_SKIN);

  function choose(style: SkinStyle) {
    setSelected(style);
    storeSkin(style);
    applySkin(style);
  }

  return (
    <div className="flex w-full max-w-sm flex-1 flex-col gap-5">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-sm text-muted">{t('subtitle')}</p>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {SKINS.map((skin) => {
          const isActive = skin.style === selected;
          return (
            <button
              key={skin.style}
              type="button"
              onClick={() => choose(skin.style)}
              aria-pressed={isActive}
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
              className="flex items-center justify-between gap-3 rounded-2xl border p-3 text-left transition-colors"
            >
              <span className="flex min-w-0 flex-col gap-2">
                <span className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-bold">{skin.name}</span>
                    {isActive && (
                      <Check size={16} className="shrink-0 text-neon-pink" />
                    )}
                  </span>
                  <span className="truncate text-xs text-muted">{skin.style}</span>
                </span>
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

              <span className="shrink-0">
                <SkinPreviewCard style={skin.style} />
              </span>
            </button>
          );
        })}
      </div>

      <form action={finishOnboarding}>
        <input type="hidden" name="skin" value={selected} />
        <input type="hidden" name="next" value={next} />
        <button type="submit" className="btn-primary w-full">
          {t('continue')}
        </button>
      </form>
    </div>
  );
}
