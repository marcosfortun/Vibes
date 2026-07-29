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

// Variante en línea (settings). Botón + mensaje al lado. SIEMPRE ocupa su
// sitio (antes desaparecía y la pantalla daba un salto al terminar de cargar),
// con tres estados:
// - Instalable: blanco encendido + "Instalar Vibes".
// - Ya instalada: apagado y deshabilitado + "Ya tienes buenas Vibes".
// - Navegador que no lo soporta: apagado y deshabilitado + aviso.
export function InstallButtonInline() {
  const { canInstall, isInstalled, install } = useInstallPrompt();
  const t = useTranslations('Install');

  const label = isInstalled
    ? t('done')
    : canInstall
      ? t('install')
      : t('unavailable');
  const disabled = isInstalled || !canInstall;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={install}
        disabled={disabled}
        aria-label={label}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-current text-foreground transition-opacity disabled:cursor-default ${
          disabled ? 'opacity-20' : 'opacity-70 hover:opacity-100'
        }`}
      >
        <Download size={18} />
      </button>
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}
