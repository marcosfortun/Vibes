'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { acceptInvitation } from '@/lib/actions/friends';

export function AcceptInvitation({
  token,
  hostUsername,
  selfUsername,
}: {
  token: string;
  hostUsername: string;
  selfUsername: string;
}) {
  const t = useTranslations('Invite');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onAccept() {
    setError(null);
    startTransition(async () => {
      const res = await acceptInvitation(token);
      if (res.ok) {
        router.push('/friends');
        router.refresh();
      } else {
        setError(res.error ?? 'invalid');
      }
    });
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
      <h1 className="text-sm font-medium uppercase tracking-wide text-muted">
        {t('title')}
      </h1>

      {/* Mensaje vistoso: invitador → invitado, en grande. */}
      <div className="flex items-center justify-center gap-3">
        <span className="text-3xl font-bold text-neon-pink">{hostUsername}</span>
        <ArrowRight size={32} strokeWidth={2.5} className="text-foreground" />
        <span className="text-3xl font-bold text-neon-green">{selfUsername}</span>
      </div>

      <p className="text-muted">{t('invitedYou', { username: hostUsername })}</p>

      {error && (
        <p role="alert" className="text-sm text-neon-pink">
          {t(`errors.${error}`)}
        </p>
      )}

      <button
        type="button"
        onClick={onAccept}
        disabled={pending}
        className="btn-primary w-full"
      >
        {pending ? t('accepting') : t('accept')}
      </button>

      <button
        type="button"
        onClick={() => router.push('/')}
        disabled={pending}
        className="text-sm text-muted hover:text-foreground disabled:opacity-50"
      >
        {t('reject')}
      </button>
    </div>
  );
}
