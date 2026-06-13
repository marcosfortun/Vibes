'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { translateItems } from '@/lib/ai/translate';
import { externalSearch } from '@/lib/providers/search';

export type NewRecState = { error?: string };

// Candidato mostrado en el paso 1 del alta.
export type Candidate =
  | {
      kind: 'existing';
      id: string;
      title: string;
      description: string | null;
      similarity: number;
    }
  | {
      kind: 'external';
      provider: string;
      title: string;
      description: string | null;
      url: string | null;
      tags: string[];
      similarity: number;
    };

type I18nJson = Record<string, string> | null;
function pick(i18n: I18nJson | undefined, source: string, locale: string): string {
  const v = i18n?.[locale];
  return v && v.trim() ? v : source;
}

const norm = (s: string) => s.trim().toLowerCase();

// Similitud Dice sobre bigramas (0..1), uniforme para internos y externos.
function similarity(a: string, b: string): number {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const bigrams = (s: string) => {
    const arr: string[] = [];
    for (let i = 0; i < s.length - 1; i++) arr.push(s.slice(i, i + 2));
    return arr;
  };
  const bx = bigrams(x);
  const by = bigrams(y);
  if (!bx.length || !by.length) return x.includes(y) || y.includes(x) ? 0.5 : 0;
  const counts = new Map<string, number>();
  for (const g of bx) counts.set(g, (counts.get(g) ?? 0) + 1);
  let inter = 0;
  for (const g of by) {
    const c = counts.get(g) ?? 0;
    if (c > 0) {
      inter++;
      counts.set(g, c - 1);
    }
  }
  return (2 * inter) / (bx.length + by.length);
}

// Paso 1: combina recomendaciones internas similares (misma categoría) y
// resultados externos (proveedores de la categoría, con IA de fallback).
// Devuelve hasta 8, ordenadas de mayor a menor similitud.
export async function searchCandidates(
  categoryId: string,
  query: string,
): Promise<Candidate[]> {
  const q = query.trim();
  if (!categoryId || q.length < 2) return [];

  const supabase = await createClient();
  const locale = await getLocale();

  // Internas (misma categoría, por similitud trigram sobre el título localizado).
  const { data: internalRows } = await supabase.rpc('find_similar_in_category', {
    q,
    p_category: categoryId,
    p_locale: locale,
    threshold: 0.15,
    p_limit: 8,
  });

  const internal: Candidate[] = (internalRows ?? []).map((r) => {
    const title = pick(
      r.title_i18n as I18nJson,
      r.title as string,
      locale,
    );
    return {
      kind: 'existing' as const,
      id: r.id as string,
      title,
      description: null,
      similarity: similarity(title, q),
    };
  });

  // Proveedores de la categoría (orden asc) + nombre de categoría para la IA.
  const { data: cat } = await supabase
    .from('categories')
    .select('name, name_i18n')
    .eq('id', categoryId)
    .single();
  const categoryName = cat
    ? pick(cat.name_i18n as I18nJson, cat.name, locale)
    : '';

  const { data: cps } = await supabase
    .from('category_providers')
    .select('position, provider:providers(kind)')
    .eq('category_id', categoryId)
    .order('position');
  const providerKinds = (cps ?? [])
    .map((r) => (r.provider as { kind: string } | null)?.kind)
    .filter((k): k is string => !!k);

  const externalRaw = await externalSearch({
    providerKinds,
    category: categoryName,
    query: q,
    limit: 8,
  });
  const external: Candidate[] = externalRaw.map((c) => ({
    kind: 'external' as const,
    provider: c.provider,
    title: c.title,
    description: c.description ?? null,
    url: c.url ?? null,
    tags: c.tags ?? [],
    similarity: similarity(c.title, q),
  }));

  // Dedup por título normalizado, prefiriendo el interno (ya existe en catálogo).
  const byTitle = new Map<string, Candidate>();
  for (const c of internal) byTitle.set(norm(c.title), c);
  for (const c of external) {
    const k = norm(c.title);
    if (!byTitle.has(k)) byTitle.set(k, c);
  }

  return [...byTitle.values()]
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 8);
}

// Selección de una recomendación existente en el paso 1 → a "Mi Lista".
export async function addExistingToList(recId: string): Promise<void> {
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
  revalidatePath('/');
  redirect('/');
}

// Paso 2: alta de una recomendación nueva. Traduce título/descr./tags nuevos a
// los 4 idiomas (si hay API key), crea vía RPC y la añade a "Mi Lista".
export async function createRecommendation(
  _prev: NewRecState,
  formData: FormData,
): Promise<NewRecState> {
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const categoryId = String(formData.get('category_id') ?? '');
  const urlRaw = String(formData.get('url') ?? '').trim();
  const tags = formData
    .getAll('tags')
    .map((t) => norm(String(t)))
    .filter(Boolean)
    .slice(0, 5);

  if (!title) return { error: 'titleRequired' };
  if (!categoryId) return { error: 'categoryRequired' };
  if (urlRaw && !/^https?:\/\//.test(urlRaw)) return { error: 'invalidUrl' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'unauth' };

  const locale = await getLocale();

  // Tags que ya existen en el catálogo (no se retraducen).
  const { data: existingRows } = await supabase
    .from('tags')
    .select('name, name_i18n')
    .in('name', tags.length ? tags : ['']);
  const existing = new Map(
    (existingRows ?? []).map((r) => [r.name, r.name_i18n as I18nJson]),
  );
  const newTags = tags.filter((t) => !existing.has(t));

  // Traduce en una sola llamada: título, descripción y tags nuevos.
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
    p_url: urlRaw,
    p_category: categoryId,
    p_translated: ok,
    p_tags: pTags,
  });
  if (error || !recId) return { error: 'createFailed' };

  await supabase.from('user_interactions').insert({
    user_id: user.id,
    recommendation_id: recId,
    saved: true,
    rating: null,
  });

  revalidatePath('/');
  redirect('/');
}
