'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { logSupabaseError } from '@/lib/supabase/log';
import { isLocale, LOCALE_COOKIE } from '@/i18n/config';
import { sendWelcomeEmail } from '@/lib/email/resend';
import { isSkinStyle } from '@/lib/skins';

// Auth sin contraseñas: Email OTP (código de un solo uso de 6 dígitos, caduca a
// la hora). Login y signup son formularios de dos pasos despachados por el campo
// oculto `step`:
//   step 'request' → se valida y se envía el código al correo.
//   step 'verify'  → se introduce el código y se abre sesión.
export type AuthState = {
  step?: 'request' | 'verify';
  email?: string;
  next?: string;
  error?: string;
};

const ONE_YEAR = 60 * 60 * 24 * 365;

// Solo admite rutas internas absolutas; evita open-redirect (//host, http://…).
function safeNext(value: unknown): string {
  const n = typeof value === 'string' ? value : '';
  if (n.startsWith('/') && !n.startsWith('//')) return n;
  return '/';
}

// Sincroniza la cookie de idioma con la preferencia del perfil tras iniciar sesión.
async function syncLocaleFromProfile(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('users')
    .select('language')
    .eq('id', userId)
    .single();
  if (isLocale(profile?.language)) {
    const store = await cookies();
    store.set(LOCALE_COOKIE, profile!.language, { path: '/', maxAge: ONE_YEAR });
  }
}

// type 'email' es el válido para los códigos OTP enviados por signInWithOtp.
async function verifyAndOpenSession(
  email: string,
  token: string,
): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  if (error || !data.user) {
    logSupabaseError('verifyOtp', error);
    return { error: 'invalidCode' };
  }
  await syncLocaleFromProfile(data.user.id);
  return { userId: data.user.id };
}

// ─────────────────────────────────────────────────────────────────────────
// LOGIN — usuario existente.
// ─────────────────────────────────────────────────────────────────────────
export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const step = String(formData.get('step') ?? 'request');
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const next = safeNext(formData.get('next'));

  if (step === 'verify') {
    const token = String(formData.get('token') ?? '').trim();
    if (!token) return { step: 'verify', email, next, error: 'codeRequired' };
    const res = await verifyAndOpenSession(email, token);
    if ('error' in res) return { step: 'verify', email, next, error: res.error };
    redirect(next);
  }

  // step 'request': enviar el código. Respuesta opaca: nunca revelamos si el
  // email existe (se avanza a 'verify' aunque el usuario no exista).
  if (!email) return { step: 'request', next, error: 'emailRequired' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error) logSupabaseError('login.signInWithOtp', error);

  return { step: 'verify', email, next };
}

// ─────────────────────────────────────────────────────────────────────────
// SIGNUP — alta invite-only. El trigger handle_new_user crea public.users a
// partir de raw_user_meta_data (username, invite_token, language) y valida el
// token. La amistad se crea después, al aceptar la invitación.
// ─────────────────────────────────────────────────────────────────────────
export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const step = String(formData.get('step') ?? 'request');
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const next = safeNext(formData.get('next'));

  if (step === 'verify') {
    const token = String(formData.get('token') ?? '').trim();
    if (!token) return { step: 'verify', email, next, error: 'codeRequired' };
    const res = await verifyAndOpenSession(email, token);
    if ('error' in res) return { step: 'verify', email, next, error: res.error };
    // Elección de skin (paso final del alta) y, tras ella, el destino original.
    redirect(`/welcome?next=${encodeURIComponent(next)}`);
  }

  // Reenvío: el usuario ya se creó al pedir el primer código, así que reenviamos
  // sin re-validar invitación/username (evita el falso "username en uso").
  if (step === 'resend') {
    if (!email) return { step: 'request', email, next, error: 'emailRequired' };
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) logSupabaseError('signup.resend.signInWithOtp', error);
    return { step: 'verify', email, next };
  }

  // step 'request': validar invitación + username y enviar el código.
  const username = String(formData.get('username') ?? '').trim();
  const inviteToken = String(formData.get('invite_token') ?? '').trim();
  const langRaw = String(formData.get('language') ?? '');
  const language = isLocale(langRaw) ? langRaw : undefined;

  if (!email) return { step: 'request', email, next, error: 'emailRequired' };
  if (!username) return { step: 'request', email, next, error: 'usernameRequired' };
  if (!inviteToken) return { step: 'request', email, next, error: 'inviteRequired' };

  const supabase = await createClient();

  const { data: tokenValid, error: tokenError } = await supabase.rpc(
    'invite_token_valid',
    { t: inviteToken },
  );
  logSupabaseError('signup.invite_token_valid', tokenError);
  if (!tokenValid) return { step: 'request', email, next, error: 'inviteInvalid' };

  const { data: usernameOk, error: usernameError } = await supabase.rpc(
    'username_available',
    { u: username },
  );
  logSupabaseError('signup.username_available', usernameError);
  // Solo bloqueamos con un `false` explícito; si la RPC falla (null), dejamos que
  // el trigger sea el gate final en vez de mostrar un "username en uso" engañoso.
  if (usernameOk === false) return { step: 'request', email, next, error: 'usernameTaken' };

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: { username, invite_token: inviteToken, language },
    },
  });
  if (error) {
    logSupabaseError('signup.signInWithOtp', error);
    return { step: 'request', email, next, error: 'signupFailed' };
  }

  return { step: 'verify', email, next };
}

// Paso final del alta: guardar la skin elegida y enviar el correo de bienvenida
// (con esa skin). Se invoca desde /welcome.
export async function finishOnboarding(formData: FormData): Promise<void> {
  const skin = String(formData.get('skin') ?? '');
  const next = safeNext(formData.get('next'));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  if (isSkinStyle(skin)) {
    const { error } = await supabase
      .from('users')
      .update({ skin })
      .eq('id', user.id);
    logSupabaseError('finishOnboarding.users.update', error);
  }

  const { data: profile } = await supabase
    .from('users')
    .select('username, language, skin')
    .eq('id', user.id)
    .single();

  // Bienvenida con la skin elegida (no fatal: nunca debe tumbar el alta).
  if (user.email && profile) {
    await sendWelcomeEmail({
      email: user.email,
      username: profile.username,
      language: profile.language,
      skin: isSkinStyle(profile.skin) ? profile.skin : undefined,
    });
  }

  revalidatePath('/', 'layout');
  redirect(next);
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
