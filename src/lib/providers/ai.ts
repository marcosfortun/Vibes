import 'server-only';
import { getAnthropic, HAIKU } from '@/lib/ai/anthropic';
import type { ExternalCandidate, Provider, SearchOpts } from './types';

// Fallback de búsqueda basado en Claude Haiku. Cubre cualquier categoría y
// entiende el SIGNIFICADO de la consulta ("true crime" → "Serial"), por eso sus
// resultados no pasan por el filtro de similitud tipográfica.
//
// El identificador incluye modelo y versión (`ai_haiku_4.5`) para poder añadir
// mañana otros modelos como proveedores distintos; la interfaz muestra "IA".
async function search(
  query: string,
  opts?: SearchOpts,
): Promise<ExternalCandidate[]> {
  const client = getAnthropic();
  if (!client) return [];
  const limit = opts?.limit ?? 8;
  const category = opts?.category ?? '';

  // Sin `url`: los enlaces inventados por el modelo suelen ser incorrectos.
  // `wikiTitle` (título del artículo de Wikipedia) sí es fiable y permite
  // resolver la imagen después contra la API real.
  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['candidates'],
    properties: {
      candidates: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['title'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            wikiTitle: { type: 'string' },
            // Sin maxItems: structured outputs no lo soporta; se recorta en código.
            tags: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  };

  try {
    const res = await client.messages.create({
      model: HAIKU,
      max_tokens: 1024,
      system:
        `Sugiere hasta ${limit} contenidos REALES y conocidos de la categoría ` +
        `"${category}" que respondan a lo que busca el usuario (por título o por ` +
        `descripción del tipo de contenido). Ordénalos de más a menos relevante. ` +
        `Para cada uno: title (nombre real), description (1-2 frases), tags (2-5 ` +
        `etiquetas cortas en el idioma de la búsqueda) y wikiTitle (título EXACTO ` +
        `del artículo de Wikipedia sobre ese contenido, si estás seguro de que ` +
        `existe; si no, omítelo). NUNCA incluyas enlaces ni URLs. No inventes ` +
        `títulos. Devuelve solo el JSON pedido.`,
      messages: [{ role: 'user', content: query }],
      output_config: { format: { type: 'json_schema', schema } },
    });
    const text = res.content.find((b) => b.type === 'text')?.text ?? '';
    const parsed = JSON.parse(text) as {
      candidates?: Array<{
        title?: string;
        description?: string;
        wikiTitle?: string;
        tags?: string[];
      }>;
    };
    return (parsed.candidates ?? [])
      .slice(0, limit)
      .map((c) => ({
        title: String(c.title ?? ''),
        description: c.description ?? null,
        url: null,
        image: null,
        wikiTitle: c.wikiTitle && c.wikiTitle.trim() ? c.wikiTitle.trim() : null,
        tags: Array.isArray(c.tags)
          ? c.tags.filter((t) => typeof t === 'string').slice(0, 5)
          : [],
        provider: AI_HAIKU_KIND,
      }))
      .filter((c) => c.title);
  } catch {
    return [];
  }
}

export const AI_HAIKU_KIND = 'ai_haiku_4.5';

export const aiHaikuProvider: Provider = {
  kind: AI_HAIKU_KIND,
  requiresKey: 'ANTHROPIC_API_KEY',
  isConfigured: () => !!process.env.ANTHROPIC_API_KEY,
  search,
  // Un modelo de lenguaje no es fuente de imágenes: inventaría las URLs.
};
