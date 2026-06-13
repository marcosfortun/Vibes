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
              url: { type: 'string' },
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
          `Para cada uno: title (nombre real), description (1-2 frases) y url (oficial ` +
          `o de referencia fiable si la conoces; si no, omítela). No inventes títulos. ` +
          `Devuelve solo el JSON pedido.`,
        messages: [{ role: 'user', content: query }],
        output_config: { format: { type: 'json_schema', schema } },
      });
      const text = res.content.find((b) => b.type === 'text')?.text ?? '';
      const parsed = JSON.parse(text) as {
        candidates?: Array<{ title?: string; description?: string; url?: string }>;
      };
      return (parsed.candidates ?? [])
        .slice(0, limit)
        .map((c) => ({
          title: String(c.title ?? ''),
          description: c.description ?? null,
          url: c.url ?? null,
          provider: 'ai',
        }))
        .filter((c) => c.title);
    } catch {
      return [];
    }
  },
};
