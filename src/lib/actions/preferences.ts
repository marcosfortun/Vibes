'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { isLocale, LOCALE_COOKIE } from '@/i18n/config';

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function updatePreferences(formData: FormData) {
  const language = String(formData.get('language') ?? '');
  const useAffinity = formData.get('use_affinity_scoring') === 'on';

  if (!isLocale(language)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('users')
    .update({ language, use_affinity_scoring: useAffinity })
    .eq('id', user.id);

  // Sincroniza la cookie de locale para que la interfaz cambie de idioma.
  const store = await cookies();
  store.set(LOCALE_COOKIE, language, { path: '/', maxAge: ONE_YEAR });

  // Revalida toda la app (cambio de idioma afecta a todos los componentes server).
  revalidatePath('/', 'layout');
}
