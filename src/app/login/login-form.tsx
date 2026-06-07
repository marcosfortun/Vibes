'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { login, type AuthState } from '@/lib/actions/auth';

export function LoginForm({ next = '' }: { next?: string }) {
  const t = useTranslations('Auth');
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    login,
    {},
  );

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <h2 className="text-xl font-semibold text-white">{t('login.title')}</h2>

      <input type="hidden" name="next" defaultValue={next} />

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

      <label className="flex flex-col gap-1 text-sm text-muted">
        {t('password')}
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="field"
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-neon-pink">
          {t(`errors.${state.error}`)}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {t('login.submit')}
      </button>

      <Link
        href="/forgot"
        className="text-center text-sm text-muted hover:text-white"
      >
        {t('forgotLink')}
      </Link>
    </form>
  );
}
