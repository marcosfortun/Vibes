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
  // Tags: campos repetidos name="tags". Se normalizan y limitan a 5 en el RPC.
  const tags = formData
    .getAll('tags')
    .map((t) => String(t).trim())
    .filter(Boolean)
    .slice(0, 5);

  if (!title) return { error: 'titleRequired' };
  if (!categoryId) return { error: 'categoryRequired' };
  if (url && !/^https?:\/\//.test(url)) return { error: 'invalidUrl' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'unauth' };

  // Alta + enlazado de tags atómico (SECURITY DEFINER, created_by = auth.uid()).
  const { data: recId, error } = await supabase.rpc('create_recommendation', {
    p_title: title,
    p_description: description ?? undefined,
    p_url: url ?? undefined,
    p_category: categoryId,
    p_tags: tags,
  });
  if (error || !recId) return { error: 'createFailed' };

  // Al crear, el creador la añade automáticamente a Mi Lista.
  await supabase.from('user_interactions').insert({
    user_id: user.id,
    recommendation_id: recId,
    saved: true,
    rating: null,
  });

  revalidatePath('/');
  redirect('/');
}
