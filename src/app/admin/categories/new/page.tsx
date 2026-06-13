import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { NewCategoryForm } from '@/components/new-category-form';
import { BackButton } from '@/components/back-button';

export default async function NewCategoryPage() {
  const t = await getTranslations('Admin.categories');
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user!.id)
    .single();

  if (profile?.role !== 'admin') redirect('/');

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <header className="page-header">
        <BackButton href="/admin/categories" label={t('back')} />
        <h1 className="page-title">{t('newTitle')}</h1>
      </header>
      <NewCategoryForm />
    </main>
  );
}
