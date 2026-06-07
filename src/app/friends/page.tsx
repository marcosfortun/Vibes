import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { FriendsManager, type Friend } from '@/components/friends-manager';
import { InviteLink } from '@/components/invite-link';
import { BackButton } from '@/components/back-button';

export default async function FriendsPage() {
  const t = await getTranslations('Friends');
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const uid = user!.id;

  const { data: rows } = await supabase
    .from('friendships')
    .select('friend_id, affinity, friend:users!friendships_friend_id_fkey(username)')
    .eq('user_id', uid);

  const friends: Friend[] = (rows ?? []).map((r) => ({
    id: r.friend_id,
    affinity: r.affinity,
    username:
      (r.friend as unknown as { username: string } | null)?.username ?? '',
  }));

  // Token de invitación activo del usuario (si lo hay). RLS limita a los propios.
  const { data: tok } = await supabase
    .from('invitation_tokens')
    .select('token')
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';

  // Altura acotada (viewport menos el espacio reservado al dock, pb-28 = 7rem)
  // para que el scroll quede SOLO dentro de la lista de amigos.
  return (
    <main className="mx-auto flex h-[calc(100dvh-7rem)] w-full max-w-md flex-col gap-4 overflow-hidden p-6">
      <header className="flex shrink-0 items-center gap-3">
        <BackButton href="/settings" label={t('back')} />
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </header>
      <div className="shrink-0">
        <InviteLink initialToken={tok?.token ?? null} baseUrl={baseUrl} />
      </div>
      <FriendsManager friends={friends} />
    </main>
  );
}
