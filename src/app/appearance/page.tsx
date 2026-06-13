import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { BackButton } from '@/components/back-button';
import { SkinSelector } from '@/components/skin-selector';
import { toSkinStyle } from '@/lib/skins';

export default async function AppearancePage() {
  const t = await getTranslations('Settings');
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('skin')
    .eq('id', user!.id)
    .single();

  // Mismo patrón que /friends y /admin/categories: la cabecera queda fija y la
  // lista hace scroll hasta el borde inferior, donde el dock la difumina.
  return (
    <main className="mx-auto -mb-28 flex h-[100dvh] w-full max-w-md flex-col gap-4 overflow-hidden px-6 pt-6">
      <header className="page-header shrink-0">
        <BackButton href="/settings" label={t('back')} />
        <h1 className="page-title">{t('skins.title')}</h1>
      </header>

      <SkinSelector current={toSkinStyle(profile?.skin)} />
    </main>
  );
}
