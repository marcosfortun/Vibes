'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type NewRecState = { error?: string };

export async function createRecommendation(
  _prev: NewRecState,
  formData: FormData,
): Promise<NewRecState> {
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const categoryId = String(formData.get('category_id') ?? '');
  const urlRaw = String(formData.get('url') ?? '').trim();
  const url = urlRaw || null;

  if (!title) return { error: 'titleRequired' };
  if (!categoryId) return { error: 'categoryRequired' };
  if (url && !/^https?:\/\//.test(url)) return { error: 'invalidUrl' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'unauth' };

  const { data: created, error } = await supabase
    .from('recommendations')
    .insert({
      title,
      description,
      url,
      category_id: categoryId,
      created_by: user.id,
    })
    .select('id')
    .single();
  if (error || !created) return { error: 'createFailed' };

  // Al crear, el creador la añade automáticamente a Mi Lista.
  await supabase.from('user_interactions').insert({
    user_id: user.id,
    recommendation_id: created.id,
    saved: true,
    rating: null,
  });

  revalidatePath('/');
  redirect('/');
}
