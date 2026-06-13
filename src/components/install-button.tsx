'use client';

import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useInstallPrompt } from '@/components/install-prompt-provider';

// Variante esquina inferior derecha (login). Solo si la app NO está instalada
// y el navegador la considera instalable. Estilo: blanco apagado.
export function InstallButtonFloating() {
  const { canInstall, isInstalled, install } = useInstallPrompt();
  const t = useTranslations('Install');
  if (isInstalled || !canInstall) return null;
  return (
    <button
      type="button"
      onClick={install}
      aria-label={t('install')}
      className="fixed bottom-6 right-6 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-current text-foreground opacity-20 transition-opacity hover:opacity-70"
    >
      <Download size={18} />
    </button>
  );
}

// Variante en línea (settings). Botón + mensaje al lado.
// - No instalada: blanco encendido + "Instalar Vibes".
// - Instalada: blanco apagado, deshabilitado + "Ya tienes buenas Vibes".
// - Si el navegador no soporta la instalación y no está instalada: nada.
export function InstallButtonInline() {
  const { canInstall, isInstalled, install } = useInstallPrompt();
  const t = useTranslations('Install');
  if (!isInstalled && !canInstall) return null;
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={install}
        disabled={isInstalled}
        aria-label={isInstalled ? t('done') : t('install')}
        className={`flex h-9 w-9 items-center justify-center rounded-full border border-current text-foreground transition-opacity disabled:cursor-default ${
          isInstalled ? 'opacity-20' : 'opacity-70 hover:opacity-100'
        }`}
      >
        <Download size={18} />
      </button>
      <span className="text-sm text-muted">
        {isInstalled ? t('done') : t('install')}
      </span>
    </div>
  );
}
