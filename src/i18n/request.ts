import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { defaultLocale, isLocale, matchLocale, type Locale } from './config';

// Locale resuelto en CADA carga:
//  - Con sesión activa: idioma del perfil del usuario (tabla users.language).
//  - Sin sesión: idioma del navegador (Accept-Language).
//  - Fallback: idioma por defecto.
export default getRequestConfig(async () => {
  let locale: Locale | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('language')
        .eq('id', user.id)
        .single();
      if (isLocale(data?.language)) locale = data.language;
    }
  } catch {
    // Si la sesión o la consulta fallan, caemos al idioma del navegador.
  }

  if (!locale) {
    const accept = (await headers()).get('accept-language');
    locale = matchLocale(accept) ?? defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
