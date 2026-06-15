'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { login, type AuthState } from '@/lib/actions/auth';

export function LoginForm({ next = '' }: { next?: string }) {
  const t = useTranslations('Auth');
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    login,
    { step: 'request' },
  );

  const verifying = state.step === 'verify';

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <h2 className="text-xl font-semibold text-foreground">{t('login.title')}</h2>

      <input type="hidden" name="next" defaultValue={next} />

      {verifying ? (
        <>
          <input type="hidden" name="email" defaultValue={state.email} />
          <p className="text-sm text-muted">
            {t('login.verifyHint', { email: state.email ?? '' })}
          </p>
          <label className="flex flex-col gap-1 text-sm text-muted">
            {t('codeLabel')}
            <input
              type="text"
              name="token"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              className="field text-center text-lg tracking-[0.4em]"
            />
          </label>

          {state.error && (
            <p role="alert" className="text-sm text-neon-pink">
              {t(`errors.${state.error}`)}
            </p>
          )}

          <button
            type="submit"
            name="step"
            value="verify"
            disabled={pending}
            className="btn-primary w-full"
          >
            {t('login.verify')}
          </button>
          <button
            type="submit"
            name="step"
            value="request"
            formNoValidate
            disabled={pending}
            className="text-center text-sm text-neon-green hover:underline"
          >
            {t('login.resend')}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">{t('login.hint')}</p>
          <label className="flex flex-col gap-1 text-sm text-muted">
            {t('email')}
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              defaultValue={state.email}
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
            name="step"
            value="request"
            disabled={pending}
            className="btn-primary w-full"
          >
            {t('login.sendCode')}
          </button>
        </>
      )}
    </form>
  );
}
