import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { BulkAddFlow } from '@/components/bulk-add-flow';

export default async function BulkAddPage() {
  const t = await getTranslations('Bulk');
  const locale = await getLocale();
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from('categories')
    .select('id,name,name_i18n,icon')
    .order('name');

  const localized = (categories ?? []).map((c) => {
    const i18n = c.name_i18n as Record<string, string> | null;
    const name = i18n?.[locale]?.trim() ? i18n[locale] : c.name;
    return { id: c.id, name, icon: c.icon };
  });

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Link href="/new" className="text-sm text-neon-pink">
          {t('single')}
        </Link>
      </div>
      <BulkAddFlow categories={localized} />
    </main>
  );
}
