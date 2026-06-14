'use server';

import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { logSupabaseError } from '@/lib/supabase/log';
import { isLocale, LOCALE_COOKIE } from '@/i18n/config';
import { sendWelcomeEmail } from '@/lib/email/resend';

export type AuthState = { error?: string; sent?: boolean };

// Solo admite rutas internas absolutas; evita open-redirect (//host, http://…).
function safeNext(value: unknown): string {
  const n = typeof value === 'string' ? value : '';
  if (n.startsWith('/') && !n.startsWith('//')) return n;
  return '/';
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const next = safeNext(formData.get('next'));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Respuesta opaca: nunca distinguimos email inexistente de contraseña incorrecta.
  if (error) return { error: 'invalidCredentials' };

  // Sincroniza el idioma de la interfaz con la preferencia del perfil.
  if (data.user) {
    const { data: profile } = await supabase
      .from('users')
      .select('language')
      .eq('id', data.user.id)
      .single();
    if (isLocale(profile?.language)) {
      const store = await cookies();
      store.set(LOCALE_COOKIE, profile!.language, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });
    }
  }

  redirect(next);
}

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const username = String(formData.get('username') ?? '').trim();
  const inviteToken = String(formData.get('invite_token') ?? '').trim();
  const langRaw = String(formData.get('language') ?? '');
  const language = isLocale(langRaw) ? langRaw : undefined;
  const next = safeNext(formData.get('next'));

  if (!username) return { error: 'usernameRequired' };
  if (!inviteToken) return { error: 'inviteRequired' };

  const supabase = await createClient();

  // Validación previa del token para dar un error claro (en vez del genérico del trigger).
  const { data: tokenValid, error: tokenError } = await supabase.rpc(
    'invite_token_valid',
    { t: inviteToken },
  );
  logSupabaseError('signup.invite_token_valid', tokenError);
  if (!tokenValid) return { error: 'inviteInvalid' };

  // Comprobación de disponibilidad de username antes de llegar al trigger (que
  // devolvería un unexpected_failure genérico en caso de colisión de unicidad).
  const { data: usernameOk, error: usernameError } = await supabase.rpc(
    'username_available',
    { u: username },
  );
  logSupabaseError('signup.username_available', usernameError);
  if (!usernameOk) return { error: 'usernameTaken' };

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, invite_token: inviteToken, language } },
  });

  // El trigger handle_new_user valida el token; si falla, Supabase devuelve error
  // genérico (el detalle vive en los Postgres logs de Supabase, no aquí).
  if (error) {
    logSupabaseError('signup.signUp', error);
    return { error: 'signupFailed' };
  }

  await sendWelcomeEmail({ email, username, language: langRaw });

  // Tras el alta volvemos al destino (normalmente /invite/<token>) para que el
  // nuevo usuario acepte explícitamente la invitación (la amistad ya no es
  // automática en el alta).
  redirect(next);
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '');
  const origin =
    (await headers()).get('origin') ?? 'http://localhost:3000';

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  });

  // Respuesta opaca: no revelamos si el email existe.
  return { sent: true };
}

export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = String(formData.get('password') ?? '');
  if (password.length < 8) return { error: 'weakPassword' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'noSession' };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: 'updateFailed' };

  redirect('/');
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
