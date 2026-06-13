import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { HomeTabs, type TabKey } from '@/components/home-tabs';
import type { CardItem } from '@/components/recommendation-card';

const REC_SELECT =
  'id,title,title_i18n,description,description_i18n,url,global_score,' +
  'category:categories(name,name_i18n,color,icon),' +
  'tags:recommendation_tags(tag:tags(name,name_i18n))';

type I18nJson = Record<string, string> | null;
type RawRec = {
  title: string;
  title_i18n?: I18nJson;
  description: string | null;
  description_i18n?: I18nJson;
  category?: {
    name: string;
    name_i18n?: I18nJson;
    color: string | null;
    icon: string | null;
  } | null;
  tags?: { tag: { name: string; name_i18n?: I18nJson } | null }[] | null;
};

// Elige la variante localizada del campo i18n; si falta, cae al texto origen.
function pick(i18n: I18nJson | undefined, source: string, locale: string): string {
  const v = i18n?.[locale];
  return v && v.trim() ? v : source;
}

// Devuelve los campos visibles de una recomendación ya localizados al idioma activo.
function localizeRec(raw: RawRec, locale: string) {
  return {
    title: pick(raw.title_i18n, raw.title, locale),
    description: raw.description
      ? pick(raw.description_i18n, raw.description, locale)
      : raw.description,
    category: raw.category
      ? {
          name: pick(raw.category.name_i18n, raw.category.name, locale),
          color: raw.category.color,
          icon: raw.category.icon,
        }
      : null,
    tags: (raw.tags ?? [])
      .map((rt) => (rt.tag ? pick(rt.tag.name_i18n, rt.tag.name, locale) : null))
      .filter((n): n is string => !!n),
  };
}

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const uid = user!.id;
  const locale = await getLocale();

  const { data: profile } = await supabase
    .from('users')
    .select('use_affinity_scoring')
    .eq('id', uid)
    .single();
  const affinityOn = profile?.use_affinity_scoring ?? false;

  // Interacciones propias (saved + rating) por recomendación.
  const { data: myInteractions } = await supabase
    .from('user_interactions')
    .select('recommendation_id, saved, rating')
    .eq('user_id', uid);
  const stateByRec = new Map(
    (myInteractions ?? []).map((r) => [
      r.recommendation_id,
      { saved: !!r.saved, rating: r.rating },
    ]),
  );
  // IDs en Mi Lista (saved=true) → se filtran de De Amigos y Tendencias.
  const savedIds = new Set(
    (myInteractions ?? []).filter((r) => r.saved).map((r) => r.recommendation_id),
  );

  // Afinidad del usuario hacia cada amigo (fila saliente).
  const { data: friendships } = await supabase
    .from('friendships')
    .select('friend_id, affinity')
    .eq('user_id', uid);
  const affinityByFriend = new Map(
    (friendships ?? []).map((f) => [f.friend_id, Number(f.affinity)]),
  );

  // Scoring personalizado query-time: Σ(rating_amigo × afinidad_hacia_amigo / 5).
  // RLS limita el select a friends con rating != null + interacciones propias.
  const { data: ratedRows } = await supabase
    .from('user_interactions')
    .select('recommendation_id, user_id, rating')
    .not('rating', 'is', null);
  const personalized = new Map<string, number>();
  for (const r of ratedRows ?? []) {
    if (r.user_id === uid || r.rating == null) continue;
    const aff = affinityByFriend.get(r.user_id);
    if (aff === undefined) continue;
    personalized.set(
      r.recommendation_id,
      (personalized.get(r.recommendation_id) ?? 0) + (r.rating * aff) / 5,
    );
  }
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const scoreOf = (rec: CardItem) =>
    affinityOn ? round1(personalized.get(rec.id) ?? 0) : rec.global_score;

  // Mi Lista: items con saved=true.
  const { data: savedRows } = await supabase
    .from('user_interactions')
    .select(`recommendation:recommendations(${REC_SELECT}), rating`)
    .eq('user_id', uid)
    .eq('saved', true)
    .order('updated_at', { ascending: false });
  const myList = (savedRows ?? [])
    .filter((r) => r.recommendation)
    .map((r) => {
      const rec = r.recommendation as unknown as CardItem;
      return {
        ...rec,
        ...localizeRec(r.recommendation as unknown as RawRec, locale),
        score: scoreOf(rec),
        state: { saved: true, rating: r.rating },
      };
    }) as CardItem[];
  // Orden por scoring desc; las ya valoradas por el usuario caen al final
  // (resta 100000 si rating != null). El número mostrado es el score real.
  const myListRank = (c: CardItem) =>
    (c.score ?? 0) - (c.state?.rating != null ? 100000 : 0);
  myList.sort((a, b) => myListRank(b) - myListRank(a));

  // De Amigos: items con rating de algún amigo, excluyendo los que ya están en Mi Lista.
  const friendRecIds = [...personalized.keys()].filter(
    (id) => !savedIds.has(id),
  );
  let friends: CardItem[] = [];
  if (friendRecIds.length > 0) {
    const { data } = await supabase
      .from('recommendations')
      .select(REC_SELECT)
      .in('id', friendRecIds);
    friends = ((data ?? []) as unknown as CardItem[])
      .map((rec) => ({
        ...rec,
        ...localizeRec(rec as unknown as RawRec, locale),
        score: scoreOf(rec),
        state: stateByRec.get(rec.id) ?? null,
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  // Tendencias: todo el catálogo excluyendo items en Mi Lista.
  const trendingQuery = supabase.from('recommendations').select(REC_SELECT);
  const { data: trendingData } = affinityOn
    ? await trendingQuery.limit(200)
    : await trendingQuery.order('global_score', { ascending: false }).limit(50);
  const trending = ((trendingData ?? []) as unknown as CardItem[])
    .filter((rec) => !savedIds.has(rec.id))
    .map((rec) => ({
      ...rec,
      ...localizeRec(rec as unknown as RawRec, locale),
      state: stateByRec.get(rec.id) ?? null,
      score: scoreOf(rec),
    }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  // Árbol de decisión: pestaña por defecto.
  const defaultTab: TabKey =
    myList.length > 0 ? 'myList' : friends.length > 0 ? 'friends' : 'trending';

  return (
    <div className="flex w-full flex-1 flex-col">
      <HomeTabs
        myList={myList}
        friends={friends}
        trending={trending}
        defaultTab={defaultTab}
      />
    </div>
  );
}
