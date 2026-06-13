import 'server-only';
import { getAnthropic, HAIKU } from './anthropic';
import { locales, defaultLocale, type Locale } from '@/i18n/config';

export type I18n = Record<Locale, string>;

// Construye un I18n con el mismo texto en todos los idiomas (fallback sin traducir).
export function sameInAllLocales(text: string): I18n {
  return Object.fromEntries(locales.map((l) => [l, text])) as I18n;
}

type Item = { id: string; text: string };

// Traduce un conjunto de textos a los 4 idiomas en UNA llamada a Haiku.
// Devuelve null si no hay API key o si la llamada falla (el llamador hace
// fallback al texto origen y marca translated=false).
export async function translateItems(
  items: Item[],
  sourceLocale: string = defaultLocale,
): Promise<Record<string, I18n> | null> {
  const real = items.filter((i) => i.text.trim().length > 0);
  if (real.length === 0) return {};

  const client = getAnthropic();
  if (!client) return null;

  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', ...locales],
          properties: {
            id: { type: 'string' },
            ...Object.fromEntries(locales.map((l) => [l, { type: 'string' }])),
          },
        },
      },
    },
  };

  try {
    const res = await client.messages.create({
      model: HAIKU,
      max_tokens: 2048,
      system:
        `Eres un traductor. Traduce cada texto a estos idiomas: ${locales.join(', ')} ` +
        `(en=inglés, es=español, fr=francés, pt=portugués). El idioma de origen es "${sourceLocale}": ` +
        `copia el texto original tal cual en su propio idioma y traduce a los demás. ` +
        `Conserva nombres propios y marcas. Devuelve solo el JSON pedido, sin comentarios.`,
      messages: [
        {
          role: 'user',
          content: JSON.stringify(
            real.map((i) => ({ id: i.id, text: i.text })),
          ),
        },
      ],
      output_config: { format: { type: 'json_schema', schema } },
    });

    const text = res.content.find((b) => b.type === 'text')?.text ?? '';
    const parsed = JSON.parse(text) as {
      items: Array<{ id: string } & Record<Locale, string>>;
    };

    const out: Record<string, I18n> = {};
    for (const row of parsed.items ?? []) {
      out[row.id] = Object.fromEntries(
        locales.map((l) => [l, row[l] ?? '']),
      ) as I18n;
    }
    // Garantiza una entrada por item (fallback al origen si el modelo omitió alguno).
    for (const i of real) {
      if (!out[i.id]) out[i.id] = sameInAllLocales(i.text);
    }
    return out;
  } catch {
    return null;
  }
}
