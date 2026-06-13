'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { requestPasswordReset, type AuthState } from '@/lib/actions/auth';

export function ForgotForm() {
  const t = useTranslations('Auth');
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    {},
  );

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-3xl font-bold">{t('forgot.title')}</h1>
      <p className="text-sm opacity-70">{t('forgot.hint')}</p>

      <label className="flex flex-col gap-1 text-sm text-muted">
        {t('email')}
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="field"
        />
      </label>

      {state.sent && (
        <p role="status" className="text-sm text-neon-green">
          {t('forgot.sent')}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {t('forgot.submit')}
      </button>

      <Link
        href="/login"
        className="text-center text-sm text-muted hover:text-foreground"
      >
        {t('login.title')}
      </Link>
    </form>
  );
}
