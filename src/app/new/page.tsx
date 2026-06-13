import { getLocale, getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { NewRecommendationFlow } from '@/components/new-recommendation-flow';

export default async function NewPage() {
  const t = await getTranslations('New');
  const locale = await getLocale();
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from('categories')
    .select('id,name,name_i18n')
    .order('name');

  // Localiza el nombre de cada categoría para el buscador del paso 1.
  const localized = (categories ?? []).map((c) => {
    const i18n = c.name_i18n as Record<string, string> | null;
    const name = i18n?.[locale]?.trim() ? i18n[locale] : c.name;
    return { id: c.id, name };
  });

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <NewRecommendationFlow categories={localized} />
    </main>
  );
}
