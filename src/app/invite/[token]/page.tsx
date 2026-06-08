import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { AcceptInvitation } from '@/components/accept-invitation';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <Image
        src="/logo.jpg"
        alt="Vibes"
        width={2657}
        height={1062}
        priority
        className="h-auto w-full max-w-[280px]"
      />
      <div className="flex w-full max-w-sm flex-col items-center gap-5 text-center">
        {children}
      </div>
    </main>
  );
}

export default async function InvitePage(props: PageProps<'/invite/[token]'>) {
  const { token } = await props.params;
  const t = await getTranslations('Invite');
  const supabase = await createClient();

  // invite_info devuelve 0 filas si el token no es válido (no expone email).
  const { data: info } = await supabase.rpc('invite_info', { t: token });
  const host = info?.[0];

  if (!host) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-white">{t('invalidTitle')}</h1>
        <p className="text-muted">{t('invalidBody')}</p>
        <Link href="/login" className="text-sm text-neon-green hover:underline">
          {t('back')}
        </Link>
      </Shell>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sin sesión: iniciar sesión o crear cuenta (preservando el token), o rechazar.
  if (!user) {
    const nextPath = `/invite/${token}`;
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
        <p className="text-muted">
          {t('invitedYou', { username: host.host_username })}
        </p>
        <p className="text-sm text-muted">{t('loginPrompt')}</p>
        <Link
          href={`/signup?invite_token=${token}&next=${encodeURIComponent(nextPath)}`}
          className="btn-primary w-full"
        >
          {t('createAccount')}
        </Link>
        <Link
          href={`/login?next=${encodeURIComponent(nextPath)}`}
          className="text-sm text-neon-green hover:underline"
        >
          {t('login')}
        </Link>
        <Link href="/login" className="text-sm text-muted hover:text-white">
          {t('reject')}
        </Link>
      </Shell>
    );
  }

  // Es tu propia invitación.
  if (user.id === host.host_id) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
        <p className="text-muted">{t('cannotSelf')}</p>
        <Link href="/" className="text-sm text-neon-green hover:underline">
          {t('goHome')}
        </Link>
      </Shell>
    );
  }

  // ¿Ya sois amigos? (RLS: solo filas salientes del llamante.)
  const { data: existing } = await supabase
    .from('friendships')
    .select('friend_id')
    .eq('user_id', user.id)
    .eq('friend_id', host.host_id)
    .maybeSingle();

  if (existing) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
        <p className="text-muted">{t('alreadyFriends')}</p>
        <Link href="/friends" className="text-sm text-neon-green hover:underline">
          {t('goToFriends')}
        </Link>
      </Shell>
    );
  }

  // Nombre del usuario actual (invitado) para el mensaje vistoso.
  const { data: me } = await supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single();

  return (
    <Shell>
      <AcceptInvitation
        token={token}
        hostUsername={host.host_username}
        selfUsername={me?.username ?? ''}
      />
    </Shell>
  );
}
