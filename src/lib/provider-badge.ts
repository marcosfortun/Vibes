// Etiqueta localizada del proveedor de un candidato externo (badge de los
// resultados del alta), traducida desde `New.providerBadge`.
//
// Los modelos de IA se identifican con prefijo + modelo + versión
// (`ai_haiku_4.5`, y mañana `ai_gemini_flash_lite`), pero al usuario siempre se
// le muestra «IA»/«AI»: por eso cualquier `kind` que empiece por `ai_` comparte
// etiqueta y añadir un modelo nuevo no toca los ficheros de idioma.
const KNOWN = ['tmdb', 'steam', 'bgg', 'itunes', 'wikipedia'];

export const AI_PREFIX = 'ai_';

export function providerBadge(
  t: (key: string) => string,
  provider: string,
): string {
  if (provider.startsWith(AI_PREFIX)) return t('providerBadge.ai');
  return KNOWN.includes(provider) ? t(`providerBadge.${provider}`) : provider;
}
