'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { signup, type AuthState } from '@/lib/actions/auth';

export function SignupForm({
  inviteToken,
  tokenValid,
}: {
  inviteToken: string;
  tokenValid: boolean;
}) {
  const t = useTranslations('Auth');
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signup,
    {},
  );

  const canSignup = Boolean(inviteToken) && tokenValid;

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-3xl font-bold">{t('signup.title')}</h1>

      <input type="hidden" name="invite_token" defaultValue={inviteToken} />
      <input
        type="hidden"
        name="language"
        defaultValue={
          typeof navigator !== 'undefined'
            ? navigator.language.slice(0, 2).toLowerCase()
            : ''
        }
      />

      {!inviteToken && (
        <p role="alert" className="text-sm text-amber-600">
          {t('signup.needInvite')}
        </p>
      )}

      {inviteToken && !tokenValid && (
        <p role="alert" className="text-sm text-red-600">
          {t('signup.invalidInvite')}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        {t('signup.username')}
        <input
          type="text"
          name="username"
          required
          autoComplete="username"
          className="rounded border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
        />
      </label>

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
        disabled={pending || !canSignup}
        className="rounded bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {t('signup.submit')}
      </button>

      <p className="text-sm opacity-70">
        {t('signup.haveAccount')}{' '}
        <Link href="/login" className="underline">
          {t('login.title')}
        </Link>
      </p>
    </form>
  );
}
