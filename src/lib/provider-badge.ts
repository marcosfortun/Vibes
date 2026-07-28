// Etiqueta localizada del proveedor de un candidato externo (badge de los
// resultados del alta). Los `kind` conocidos se traducen desde
// `New.providerBadge` («IA» en es/fr/pt, marcas propias en el resto); uno
// desconocido se muestra tal cual para no romper la UI.
const KNOWN = ['tmdb', 'steam', 'bgg', 'ai'];

export function providerBadge(
  t: (key: string) => string,
  provider: string,
): string {
  return KNOWN.includes(provider) ? t(`providerBadge.${provider}`) : provider;
}
