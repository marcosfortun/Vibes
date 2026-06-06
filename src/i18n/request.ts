import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { defaultLocale, isLocale, matchLocale } from './config';

// Locale: 1) cookie (perfil del usuario); 2) idioma del navegador (Accept-Language);
// 3) por defecto. Así un usuario no identificado o en el signup ve la interfaz en su idioma.
export default getRequestConfig(async () => {
  const store = await cookies();
  const candidate = store.get('locale')?.value;

  let locale = isLocale(candidate) ? candidate : undefined;
  if (!locale) {
    const accept = (await headers()).get('accept-language');
    locale = matchLocale(accept) ?? defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
