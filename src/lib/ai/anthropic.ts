import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

// Cliente Anthropic solo de servidor. Devuelve null si no hay ANTHROPIC_API_KEY,
// para que las features de IA degraden con elegancia (sin traducción, sin IA en
// la búsqueda externa) en lugar de romper.
let cached: Anthropic | null | undefined;

export function getAnthropic(): Anthropic | null {
  if (cached !== undefined) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  cached = apiKey ? new Anthropic({ apiKey }) : null;
  return cached;
}

// Modelo barato/rápido para traducción y candidatos de búsqueda.
export const HAIKU = 'claude-haiku-4-5';
