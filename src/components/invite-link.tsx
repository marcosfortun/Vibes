'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { ensureInvite, regenerateInvite, revokeInvite } from '@/lib/actions/friends';

export function InviteLink({
  initialToken,
  baseUrl,
}: {
  initialToken: string | null;
  baseUrl: string;
}) {
  const t = useTranslations('Friends');
  const [token, setToken] = useState<string | null>(initialToken);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const base =
    baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const link = token ? `${base}/invite/${token}` : '';
  const shareText = t('shareText');

  function gen() {
    startTransition(async () => setToken(await ensureInvite()));
  }
  function regen() {
    startTransition(async () => {
      setToken(await regenerateInvite());
      setCopied(false);
    });
  }
  function revoke() {
    startTransition(async () => {
      await revokeInvite();
      setToken(null);
      setCopied(false);
    });
  }
  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // El navegador puede bloquear el portapapeles; el usuario puede copiar a mano.
    }
  }
  async function share() {
    if (!link) return;
    // Web Share API: abre el selector nativo de apps (WhatsApp, Telegram, email,
    // etc.). Si no está disponible (p. ej. escritorio), recurrimos a copiar.
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Vibes', text: shareText, url: link });
      } catch {
        // El usuario canceló el selector: no es un error.
      }
    } else {
      await copy();
    }
  }

  return (
    <section className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-4">
      <h2 className="text-lg font-semibold text-white">{t('inviteTitle')}</h2>

      {token ? (
        <div className="mt-3 flex flex-col gap-3">
          {/* Fila 1: enlace de solo lectura a ancho completo. */}
          <input
            type="text"
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            className="field text-sm"
          />

          {/* Fila 2: copiar (secundario, izquierda) + compartir (principal, derecha). */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copy}
              disabled={pending}
              className="btn-secondary flex-1"
            >
              {copied ? t('copied') : t('copy')}
            </button>
            <button
              type="button"
              onClick={share}
              disabled={pending}
              className="btn-primary btn-inline flex-1"
            >
              {t('share')}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">{t('expiresHint')}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={regen}
                disabled={pending}
                className="text-sm text-neon-green hover:underline disabled:opacity-50"
              >
                {t('regenerate')}
              </button>
              <button
                type="button"
                onClick={revoke}
                disabled={pending}
                className="btn-danger text-sm hover:underline"
              >
                {t('revoke')}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={gen}
          disabled={pending}
          className="btn-primary mt-3 w-full"
        >
          {t('generate')}
        </button>
      )}
    </section>
  );
}
