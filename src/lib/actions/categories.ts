'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type CategoryState = { error?: string; ok?: boolean };

export async function createCategory(
  _prev: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const name = String(formData.get('name') ?? '').trim();
  const icon = String(formData.get('icon') ?? '').trim() || null;
  const color = String(formData.get('color') ?? '').trim() || null;

  if (!name) return { error: 'nameRequired' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('categories')
    .insert({ name, icon, color });

  if (error) {
    return { error: error.code === '23505' ? 'duplicate' : 'failed' };
  }

  revalidatePath('/admin');
  revalidatePath('/new');
  return { ok: true };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  await supabase.from('categories').delete().eq('id', id);
  revalidatePath('/admin');
  revalidatePath('/new');
}
