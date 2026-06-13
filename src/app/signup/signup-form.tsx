'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { signup, type AuthState } from '@/lib/actions/auth';

export function SignupForm({
  inviteToken,
  tokenValid,
  next = '',
}: {
  inviteToken: string;
  tokenValid: boolean;
  next?: string;
}) {
  const t = useTranslations('Auth');
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signup,
    {},
  );

  const canSignup = Boolean(inviteToken) && tokenValid;

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <h2 className="text-xl font-semibold text-foreground">{t('signup.title')}</h2>

      <input type="hidden" name="invite_token" defaultValue={inviteToken} />
      <input type="hidden" name="next" defaultValue={next} />
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
        <p role="alert" className="text-sm text-amber-400">
          {t('signup.needInvite')}
        </p>
      )}

      {inviteToken && !tokenValid && (
        <p role="alert" className="text-sm text-neon-pink">
          {t('signup.invalidInvite')}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm text-muted">
        {t('signup.username')}
        <input
          type="text"
          name="username"
          required
          autoComplete="username"
          className="field"
        />
      </label>

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
          minLength={6}
          autoComplete="new-password"
          className="field"
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-neon-pink">
          {t(`errors.${state.error}`)}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !canSignup}
        className="btn-primary w-full"
      >
        {t('signup.submit')}
      </button>

      <p className="text-center text-sm text-muted">
        {t('signup.haveAccount')}{' '}
        <Link href="/login" className="text-neon-green hover:underline">
          {t('login.title')}
        </Link>
      </p>
    </form>
  );
}
