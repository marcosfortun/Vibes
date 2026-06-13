import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { AdminCategories } from '@/components/admin-categories';
import { BackButton } from '@/components/back-button';

export default async function AdminCategoriesPage() {
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

  // Solo admin (refuerzo en UI; la RLS ya bloquea escrituras de no-admin).
  if (profile?.role !== 'admin') redirect('/');

  const { data: categories } = await supabase
    .from('categories')
    .select('id,name,icon,color')
    .order('name');

  // Mismo patrón que /friends: la cabecera queda fija y la lista hace scroll
  // hasta el borde inferior, donde el dock la difumina con su degradado.
  return (
    <main className="mx-auto -mb-28 flex h-[100dvh] w-full max-w-md flex-col gap-4 overflow-hidden px-6 pt-6">
      <header className="page-header shrink-0">
        <BackButton href="/admin" label={t('back')} />
        <h1 className="page-title">{t('title')}</h1>
        <Link
          href="/admin/categories/new"
          aria-label={t('newAria')}
          className="back-button ml-auto"
        >
          <Plus size={20} strokeWidth={2} />
        </Link>
      </header>
      <AdminCategories categories={categories ?? []} />
    </main>
  );
}
