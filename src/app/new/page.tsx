import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { NewRecommendationForm } from '@/components/new-recommendation-form';

export default async function NewPage() {
  const t = await getTranslations('New');
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from('categories')
    .select('id,name,icon,color')
    .order('name');

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <NewRecommendationForm categories={categories ?? []} />
    </main>
  );
}
