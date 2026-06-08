import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { AdminCategories } from '@/components/admin-categories';
import { BackButton } from '@/components/back-button';

export default async function AdminPage() {
  const t = await getTranslations('Admin');
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user!.id)
    .single();

  // Solo admin (refuerzo en UI; la RLS ya bloquea escrituras de no-admin).
  if (profile?.role !== 'admin') redirect('/');

  const { data: categories } = await supabase
    .from('categories')
    .select('id,name,icon,color')
    .order('name');

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-6">
      <header className="page-header w-full max-w-md">
        <BackButton href="/settings" label={t('back')} />
        <h1 className="page-title">{t('title')}</h1>
      </header>
      <AdminCategories categories={categories ?? []} />
    </main>
  );
}
