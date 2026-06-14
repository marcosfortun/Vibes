'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { logSupabaseError } from '@/lib/supabase/log';
import { translateItems } from '@/lib/ai/translate';

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

  // Traducción automática del nombre a los 4 idiomas (si hay API key).
  const locale = await getLocale();
  const translated = await translateItems([{ id: 'name', text: name }], locale);

  const { error } = await supabase.from('categories').insert({
    name,
    icon,
    color,
    name_i18n: translated?.['name'] ?? null,
    translated: translated !== null,
  });

  if (error) {
    logSupabaseError('createCategory.categories.insert', error);
    return { error: error.code === '23505' ? 'duplicate' : 'failed' };
  }

  revalidatePath('/admin/categories');
  revalidatePath('/new');
  // El alta vive en su propia pantalla: al guardar, volvemos a la lista.
  redirect('/admin/categories');
}

// Elimina una categoría. Como recommendations.category_id es NOT NULL y el
// cliente no tiene UPDATE sobre recommendations, la migración + borrado se hace
// atómicamente en el RPC admin_delete_category (SECURITY DEFINER, valida admin).
export async function deleteCategory(id: string, targetId?: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc('admin_delete_category', {
    p_category: id,
    p_migrate_to: targetId ?? undefined,
  });
  logSupabaseError('deleteCategory.admin_delete_category', error);
  revalidatePath('/admin/categories');
  revalidatePath('/new');
}
