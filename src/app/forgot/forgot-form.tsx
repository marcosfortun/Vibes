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

      <label className="flex flex-col gap-1 text-sm">
        {t('email')}
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="rounded border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
        />
      </label>

      {state.sent && (
        <p role="status" className="text-sm text-green-600">
          {t('forgot.sent')}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {t('forgot.submit')}
      </button>

      <Link href="/login" className="text-sm underline">
        {t('login.title')}
      </Link>
    </form>
  );
}
