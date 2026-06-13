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

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <header className="page-header">
        <BackButton href="/settings" label={t('back')} />
        <h1 className="page-title">{t('skins.title')}</h1>
      </header>

      <SkinSelector current={toSkinStyle(profile?.skin)} />
    </main>
  );
}
