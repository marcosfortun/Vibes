import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Tags, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
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

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <header className="page-header">
        <BackButton href="/settings" label={t('back')} />
        <h1 className="page-title">{t('title')}</h1>
      </header>

      <nav className="flex flex-col gap-3">
        <Link
          href="/admin/categories"
          className="list-row text-foreground transition-colors hover:bg-[var(--glass-bg)]"
        >
          <span className="flex min-w-0 items-center gap-3">
            <Tags size={20} strokeWidth={1.75} className="shrink-0 text-neon-pink" />
            <span className="truncate">{t('menu.categories')}</span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-muted" />
        </Link>
      </nav>
    </main>
  );
}
