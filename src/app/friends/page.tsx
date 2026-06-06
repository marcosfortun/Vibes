import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { FriendsManager, type Friend } from '@/components/friends-manager';
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

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-6">
      <header className="flex w-full max-w-md items-center gap-3">
        <BackButton href="/settings" label={t('back')} />
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </header>
      <FriendsManager friends={friends} selfId={uid} />
    </main>
  );
}
