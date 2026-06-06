import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { QuedadaPlanner } from '@/components/quedada-planner';

export default async function QuedadaPage() {
  const t = await getTranslations('Quedada');
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const uid = user!.id;

  const { data: rows } = await supabase
    .from('friendships')
    .select('friend_id, friend:users!friendships_friend_id_fkey(username)')
    .eq('user_id', uid);

  const friends = (rows ?? []).map((r) => ({
    id: r.friend_id,
    username:
      (r.friend as unknown as { username: string } | null)?.username ?? '',
  }));

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-6">
      <h1 className="w-full max-w-md text-2xl font-bold">{t('title')}</h1>
      <p className="w-full max-w-md text-sm opacity-70">{t('hint')}</p>
      <QuedadaPlanner friends={friends} selfId={uid} />
    </main>
  );
}
