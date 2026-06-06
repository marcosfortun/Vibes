'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { updatePassword, type AuthState } from '@/lib/actions/auth';

export function UpdatePasswordForm() {
  const t = useTranslations('Auth');
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    updatePassword,
    {},
  );

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-3xl font-bold">{t('update.title')}</h1>

      <label className="flex flex-col gap-1 text-sm">
        {t('password')}
        <input
          type="password"
          name="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="rounded border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {t(`errors.${state.error}`)}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {t('update.submit')}
      </button>
    </form>
  );
}
