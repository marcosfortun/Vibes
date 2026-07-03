import 'server-only';
import { getAnthropic, HAIKU } from '@/lib/ai/anthropic';
import type { ExternalCandidate, ProviderAdapter, SearchOpts } from './types';

// Proveedor universal basado en Claude Haiku. Sugiere contenidos reales que
// coincidan con el título dentro de una categoría. Cubre cualquier categoría.
export const aiAdapter: ProviderAdapter = {
  kind: 'ai',
  async search(query: string, opts?: SearchOpts): Promise<ExternalCandidate[]> {
    const client = getAnthropic();
    if (!client) return [];
    const limit = opts?.limit ?? 8;
    const category = opts?.category ?? '';

    // Sin `url`: los enlaces inventados por el modelo suelen ser incorrectos.
    // `wikiTitle` (título del artículo de Wikipedia) sí es fiable y permite
    // resolver la imagen después contra la API real (resolve-image.ts).
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
          `"${category}" cuyo título coincida o se parezca a lo que busca el usuario. ` +
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
          wikiTitle: c.wikiTitle && c.wikiTitle.trim() ? c.wikiTitle.trim() : null,
          tags: Array.isArray(c.tags) ? c.tags.filter((t) => typeof t === 'string').slice(0, 5) : [],
          provider: 'ai',
        }))
        .filter((c) => c.title);
    } catch {
      return [];
    }
  },
};
