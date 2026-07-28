import 'server-only';
import { aiHaikuProvider } from './ai';
import { bggProvider } from './bgg';
import { itunesProvider } from './itunes';
import { steamProvider } from './steam';
import { tmdbProvider } from './tmdb';
import { wikipediaProvider } from './wikipedia';
import type { Provider } from './types';

// Fuente de verdad de QUÉ sabe hacer cada proveedor. La tabla `providers`
// replica estas capacidades (can_search / can_resolve_image / requires_key)
// para la futura UI de admin; un test comprueba que no se desincronicen.
export const PROVIDERS: readonly Provider[] = [
  tmdbProvider,
  steamProvider,
  bggProvider,
  itunesProvider,
  aiHaikuProvider,
  wikipediaProvider,
] as const;

const BY_KIND = new Map(PROVIDERS.map((p) => [p.kind, p]));

export function providerFor(kind: string): Provider | undefined {
  return BY_KIND.get(kind);
}

// Capacidades declaradas, tal y como deben figurar en BD.
export function capabilitiesOf(p: Provider) {
  return {
    kind: p.kind,
    can_search: typeof p.search === 'function',
    can_resolve_image: typeof p.resolveImage === 'function',
    requires_key: p.requiresKey ?? null,
  };
}
