'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { logSupabaseError } from '@/lib/supabase/log';
import { translateItems } from '@/lib/ai/translate';
import {
  resolveImageFor,
  searchFallback,
  searchProviders,
} from '@/lib/providers/search';
import type { ResolvedImage } from '@/lib/providers/types';
import {
  CATALOG_BONUS,
  MAX_RESULTS,
  MIN_QUERY_LENGTH,
  MIN_SIMILARITY,
  SEARCH_CACHE_TTL_MS,
} from '@/lib/providers/config';
import { similarity } from '@/lib/similarity';
import { LIMITS } from '@/lib/limits';

export type NewRecState = { error?: string };

// Datos que un resultado externo descartado en el dedup cede a la ficha del
// catálogo que le ganó: si el usuario la elige, se rellenan sus huecos.
export type EnrichPayload = { url: string | null; image: string | null };

// Candidato mostrado en el paso 1 del alta.
export type Candidate =
  | {
      kind: 'existing';
      id: string;
      title: string;
      description: string | null;
      similarity: number;
      enrich?: EnrichPayload;
    }
  | {
      kind: 'external';
      provider: string;
      title: string;
      description: string | null;
      url: string | null;
      image: string | null;
      wikiTitle: string | null;
      tags: string[];
      similarity: number;
    };

type I18nJson = Record<string, string> | null;
function pick(i18n: I18nJson | undefined, source: string, locale: string): string {
  const v = i18n?.[locale];
  return v && v.trim() ? v : source;
}

const norm = (s: string) => s.trim().toLowerCase();

// Caché en memoria de resultados por (categoría, idioma, consulta). Evita
// repetir el abanico de llamadas mientras el usuario teclea o cuando el wizard
// de carga masiva vuelve sobre el mismo título. Es por instancia (en Vercel,
// por lambda): sirve de amortiguador, no de caché global.
const searchCache = new Map<string, { at: number; value: Candidate[] }>();
const SEARCH_CACHE_MAX = 200;

function readCache(key: string): Candidate[] | null {
  const hit = searchCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > SEARCH_CACHE_TTL_MS) {
    searchCache.delete(key);
    return null;
  }
  return hit.value;
}

function writeCache(key: string, value: Candidate[]): void {
  if (searchCache.size >= SEARCH_CACHE_MAX) {
    // Purga simple: fuera la entrada más antigua insertada.
    const oldest = searchCache.keys().next().value;
    if (oldest) searchCache.delete(oldest);
  }
  searchCache.set(key, { at: Date.now(), value });
}

// Paso 1 del alta. Lanza EN PARALELO la búsqueda en el catálogo interno y en
// los proveedores de la categoría; filtra por similitud, bonifica al catálogo,
// deduplica (gana el catálogo, que además se queda la imagen/URL del externo
// descartado para enriquecerse si el usuario lo elige) y recorta a MAX_RESULTS.
//
// Si ningún proveedor especializado aporta un resultado por encima del umbral
// —porque no hay proveedores, no tienen key, fallan, expiran o lo que devuelven
// no se parece a la consulta— entra el fallback de IA, cuyos resultados NO se
// filtran por similitud (su relevancia es semántica, no tipográfica).
export async function searchCandidates(
  categoryId: string,
  query: string,
): Promise<Candidate[]> {
  const q = query.trim();
  if (!categoryId || q.length < MIN_QUERY_LENGTH) return [];

  const supabase = await createClient();
  const locale = await getLocale();

  const cacheKey = `${categoryId}|${locale}|${q.toLowerCase()}`;
  const cached = readCache(cacheKey);
  if (cached) return cached;

  // Categoría (nombre canónico + localizado) y sus proveedores por orden.
  const [{ data: cat }, { data: cps }] = await Promise.all([
    supabase.from('categories').select('name, name_i18n').eq('id', categoryId).single(),
    supabase
      .from('category_providers')
      .select('position, provider:providers(kind)')
      .eq('category_id', categoryId)
      .order('position'),
  ]);
  const canonicalCategory = cat?.name ?? '';
  const categoryName = cat ? pick(cat.name_i18n as I18nJson, cat.name, locale) : '';
  const providerKinds = (cps ?? [])
    .map((r) => (r.provider as { kind: string } | null)?.kind)
    .filter((k): k is string => !!k);

  const opts = {
    category: categoryName,
    canonicalCategory,
    locale,
    limit: MAX_RESULTS,
  };

  // Catálogo y proveedores, a la vez.
  const [internalRes, providerRes] = await Promise.all([
    supabase.rpc('find_similar_in_category', {
      q,
      p_category: categoryId,
      p_locale: locale,
      threshold: 0.15,
      p_limit: MAX_RESULTS,
    }),
    searchProviders(providerKinds, q, opts),
  ]);
  logSupabaseError('searchCandidates.find_similar_in_category', internalRes.error);

  // Catálogo: filtra por umbral y DESPUÉS bonifica (el bonus no rescata nada).
  const internal: Candidate[] = (internalRes.data ?? [])
    .map((r) => {
      const title = pick(r.title_i18n as I18nJson, r.title as string, locale);
      return {
        kind: 'existing' as const,
        id: r.id as string,
        title,
        description: null,
        similarity: similarity(title, q),
      };
    })
    .filter((c) => c.similarity >= MIN_SIMILARITY)
    .map((c) => ({ ...c, similarity: c.similarity + CATALOG_BONUS }));

  const toExternal = (c: {
    provider: string;
    title: string;
    description?: string | null;
    url?: string | null;
    image?: string | null;
    wikiTitle?: string | null;
    tags?: string[];
  }): Candidate => ({
    kind: 'external' as const,
    provider: c.provider,
    title: c.title,
    description: c.description ?? null,
    url: c.url ?? null,
    image: c.image ?? null,
    wikiTitle: c.wikiTitle ?? null,
    tags: c.tags ?? [],
    similarity: similarity(c.title, q),
  });

  let external = providerRes.candidates
    .map(toExternal)
    .filter((c) => c.similarity >= MIN_SIMILARITY);

  // Fallback: ningún proveedor especializado dio un resultado válido.
  if (!external.length) {
    const ai = await searchFallback(q, opts);
    // Sin filtro de similitud, y conservando el orden de relevancia del modelo.
    external = ai.map((c, i) => ({ ...toExternal(c), similarity: 1 - i / 100 }));
  }

  // Dedup por título normalizado: gana el catálogo (evita fichas duplicadas) y
  // se queda con la imagen/URL del externo descartado para enriquecerse luego.
  const byTitle = new Map<string, Candidate>();
  for (const c of internal) byTitle.set(norm(c.title), c);
  for (const c of external) {
    if (c.kind !== 'external') continue;
    const k = norm(c.title);
    const winner = byTitle.get(k);
    if (!winner) {
      byTitle.set(k, c);
      continue;
    }
    if (winner.kind === 'existing') {
      const enrich = winner.enrich ?? { url: null, image: null };
      byTitle.set(k, {
        ...winner,
        enrich: {
          url: enrich.url ?? c.url,
          image: enrich.image ?? c.image,
        },
      });
    } else if (!winner.image && c.image) {
      // Entre externos duplicados, prevalece el que aporta imagen.
      byTitle.set(k, c);
    }
  }

  // Desempate por el orden de proveedores declarado en la categoría.
  const rank = (c: Candidate) =>
    c.kind === 'existing' ? -1 : (providerRes.order.get(c.provider) ?? 99);

  const result = [...byTitle.values()]
    .sort((a, b) => b.similarity - a.similarity || rank(a) - rank(b))
    .slice(0, MAX_RESULTS);

  writeCache(cacheKey, result);
  return result;
}

// Selección de una recomendación existente en el paso 1 → a "Mi Lista".
// Si el dedup descartó un resultado externo con imagen/URL, se aprovecha para
// completar los huecos de la ficha (nunca sobrescribe lo que ya tiene).
export async function addExistingToList(
  recId: string,
  enrich?: EnrichPayload,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  // Insert directo; si ya existe interacción (p. ej. ya la valoró), solo marca
  // saved=true. No usamos upsert: su ON CONFLICT DO UPDATE tocaría user_id/
  // recommendation_id, que no tienen GRANT UPDATE (solo saved/rating).
  const { error } = await supabase
    .from('user_interactions')
    .insert({ user_id: user.id, recommendation_id: recId, saved: true });
  if (error) {
    await supabase
      .from('user_interactions')
      .update({ saved: true })
      .eq('user_id', user.id)
      .eq('recommendation_id', recId);
  }
  await enrichRecommendation(supabase, recId, enrich);
  revalidatePath('/');
  redirect('/');
}

// Rellena huecos (url / image_url) de una ficha existente vía RPC. La RPC es
// SECURITY DEFINER y solo escribe donde hay NULL: `authenticated` no tiene
// UPDATE sobre recommendations (ver pd-security-design.md).
async function enrichRecommendation(
  supabase: SupabaseServer,
  recId: string,
  enrich?: EnrichPayload,
): Promise<void> {
  const url = enrich?.url?.trim();
  const image = enrich?.image?.trim();
  if (!url && !image) return;
  const { error } = await supabase.rpc('enrich_recommendation', {
    p_id: recId,
    p_url: url && url.length <= LIMITS.url ? url : undefined,
    p_image_url: image && image.length <= LIMITS.imageUrl ? image : undefined,
  });
  logSupabaseError('enrichRecommendation', error);
}

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

// Paso 2: alta de una recomendación nueva desde el formulario.
export async function createRecommendation(
  _prev: NewRecState,
  formData: FormData,
): Promise<NewRecState> {
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const categoryId = String(formData.get('category_id') ?? '');
  const urlRaw = String(formData.get('url') ?? '').trim();
  const imageUrlRaw = String(formData.get('image_url') ?? '').trim();
  const wikiTitleRaw = String(formData.get('wiki_title') ?? '').trim();
  const tags = formData
    .getAll('tags')
    .map((t) => norm(String(t)).slice(0, LIMITS.tag))
    .filter(Boolean)
    .slice(0, 5);

  if (!title) return { error: 'titleRequired' };
  if (!categoryId) return { error: 'categoryRequired' };
  if (urlRaw && !/^https?:\/\//.test(urlRaw)) return { error: 'invalidUrl' };
  if (imageUrlRaw && !/^https?:\/\//.test(imageUrlRaw)) return { error: 'invalidUrl' };
  if (
    title.length > LIMITS.title ||
    description.length > LIMITS.description ||
    urlRaw.length > LIMITS.url ||
    imageUrlRaw.length > LIMITS.imageUrl
  ) {
    return { error: 'tooLong' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'unauth' };

  const locale = await getLocale();

  // Sin imagen en el formulario → intenta resolverla (fuentes por categoría /
  // Wikipedia). Best-effort: si no hay, la recomendación se crea sin imagen.
  // Si además no hay URL, se usa la de la fuente de la imagen (artículo/ficha)
  // para que el título y la imagen de la tarjeta sean clicables.
  let imageUrl = imageUrlRaw;
  let url = urlRaw;
  if (!imageUrl) {
    const resolved = await resolveImageForCategory(supabase, categoryId, {
      title,
      locale,
      wikiTitle: wikiTitleRaw || null,
    });
    if (resolved) {
      imageUrl = resolved.image;
      if (!url && resolved.sourceUrl) url = resolved.sourceUrl;
    }
  }

  const recId = await insertRecommendationInCategory(
    supabase,
    user.id,
    locale,
    categoryId,
    { title, description, url, imageUrl, tags },
  );
  if (!recId) return { error: 'createFailed' };

  revalidatePath('/');
  redirect('/');
}

// Resuelve la imagen (y la URL de su ficha) al crear: recorre los proveedores
// de la categoría que sepan resolver imagen y, como último recurso, Wikipedia.
// Se consulta con el título ya elegido, así que los proveedores lo encuentran
// aunque la búsqueda original del usuario no diera resultados.
async function resolveImageForCategory(
  supabase: SupabaseServer,
  categoryId: string,
  args: { title: string; locale: string; wikiTitle: string | null },
): Promise<ResolvedImage | null> {
  const [{ data: cat }, { data: cps }] = await Promise.all([
    supabase.from('categories').select('name').eq('id', categoryId).single(),
    supabase
      .from('category_providers')
      .select('position, provider:providers(kind)')
      .eq('category_id', categoryId)
      .order('position'),
  ]);
  const providerKinds = (cps ?? [])
    .map((r) => (r.provider as { kind: string } | null)?.kind)
    .filter((k): k is string => !!k);

  const resolved = await resolveImageFor(providerKinds, args.title, {
    canonicalCategory: cat?.name ?? '',
    category: cat?.name ?? '',
    locale: args.locale,
    wikiTitle: args.wikiTitle,
  });
  if (!resolved || resolved.image.length > LIMITS.imageUrl) return null;
  return {
    image: resolved.image,
    sourceUrl:
      resolved.sourceUrl && resolved.sourceUrl.length <= LIMITS.url
        ? resolved.sourceUrl
        : null,
  };
}

// Núcleo de creación reutilizable (paso 2 y carga masiva): traduce título/
// descripción/tags nuevos, crea vía RPC en la categoría dada y la añade a "Mi
// Lista". Devuelve el id o null. No hace redirect/revalidate: lo decide quien llama.
async function insertRecommendationInCategory(
  supabase: SupabaseServer,
  userId: string,
  locale: string,
  categoryId: string,
  data: {
    title: string;
    description: string;
    url: string;
    imageUrl: string;
    tags: string[];
  },
): Promise<string | null> {
  const { title, description, url, imageUrl, tags } = data;
  const { data: existingRows } = await supabase
    .from('tags')
    .select('name, name_i18n')
    .in('name', tags.length ? tags : ['']);
  const existing = new Map(
    (existingRows ?? []).map((r) => [r.name, r.name_i18n as I18nJson]),
  );
  const newTags = tags.filter((t) => !existing.has(t));
  const items = [
    { id: 'title', text: title },
    ...(description ? [{ id: 'description', text: description }] : []),
    ...newTags.map((t) => ({ id: `tag:${t}`, text: t })),
  ];
  const translated = await translateItems(items, locale);
  const ok = translated !== null;
  const pTags = tags.map((name) => {
    if (existing.has(name)) {
      return { name, name_i18n: existing.get(name) ?? null, translated: true };
    }
    const i18n = translated?.[`tag:${name}`] ?? null;
    return { name, name_i18n: i18n, translated: i18n !== null };
  });

  const { data: recId, error } = await supabase.rpc('create_recommendation', {
    p_title: title,
    p_title_i18n: translated?.['title'] ?? null,
    p_description: description,
    p_description_i18n: description ? (translated?.['description'] ?? null) : null,
    p_url: url,
    p_category: categoryId,
    p_translated: ok,
    p_tags: pTags,
    p_image_url: imageUrl || undefined,
  });
  if (error || !recId) {
    logSupabaseError('insertRecommendation.create_recommendation', error);
    return null;
  }

  const { error: saveError } = await supabase.from('user_interactions').insert({
    user_id: userId,
    recommendation_id: recId as string,
    saved: true,
    rating: null,
  });
  logSupabaseError('insertRecommendation.user_interactions.insert', saveError);
  return recId as string;
}

// ─────────────────────────────────────────────────────────────────────────
// Carga masiva: un candidato ya elegido en el wizard se materializa aquí.
// Sin redirect (el wizard sigue con el siguiente título); revalida al cerrar.
// ─────────────────────────────────────────────────────────────────────────
export type BulkPick =
  | { kind: 'existing'; id: string; enrich?: EnrichPayload }
  | {
      kind: 'external';
      title: string;
      description: string | null;
      url: string | null;
      image: string | null;
      wikiTitle: string | null;
      tags: string[];
    }
  | { kind: 'scratch'; title: string };

export async function bulkAddItem(
  categoryId: string,
  pick: BulkPick,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  if (!categoryId) return { ok: false };

  // Existente: solo marcar saved (mismo patrón que addExistingToList, sin redirect).
  if (pick.kind === 'existing') {
    const { error } = await supabase
      .from('user_interactions')
      .insert({ user_id: user.id, recommendation_id: pick.id, saved: true });
    if (error) {
      await supabase
        .from('user_interactions')
        .update({ saved: true })
        .eq('user_id', user.id)
        .eq('recommendation_id', pick.id);
    }
    await enrichRecommendation(supabase, pick.id, pick.enrich);
    return { ok: true };
  }

  const locale = await getLocale();
  const title = (pick.kind === 'scratch' ? pick.title : pick.title).trim().slice(0, LIMITS.title);
  if (!title) return { ok: false };

  const data =
    pick.kind === 'external'
      ? {
          title,
          description: (pick.description ?? '').slice(0, LIMITS.description),
          url: pick.url && /^https?:\/\//.test(pick.url) ? pick.url.slice(0, LIMITS.url) : '',
          imageUrl:
            pick.image && /^https?:\/\//.test(pick.image)
              ? pick.image.slice(0, LIMITS.imageUrl)
              : '',
          tags: (pick.tags ?? [])
            .map((t) => norm(t).slice(0, LIMITS.tag))
            .filter(Boolean)
            .slice(0, 5),
        }
      : { title, description: '', url: '', imageUrl: '', tags: [] as string[] };

  // Candidato sin imagen propia (IA o solo-título) → intenta resolverla; si
  // tampoco hay URL, se usa la de la fuente de la imagen (tarjeta clicable).
  if (!data.imageUrl) {
    const resolved = await resolveImageForCategory(supabase, categoryId, {
      title,
      locale,
      wikiTitle: pick.kind === 'external' ? pick.wikiTitle : null,
    });
    if (resolved) {
      data.imageUrl = resolved.image;
      if (!data.url && resolved.sourceUrl) data.url = resolved.sourceUrl;
    }
  }

  const recId = await insertRecommendationInCategory(
    supabase,
    user.id,
    locale,
    categoryId,
    data,
  );
  return { ok: !!recId };
}

// Revalida la home tras terminar una tanda de carga masiva.
export async function bulkAddDone(): Promise<void> {
  revalidatePath('/');
}
