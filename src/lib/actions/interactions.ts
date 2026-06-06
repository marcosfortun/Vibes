'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type Patch = { saved?: boolean; rating?: number | null };

// Aplica un patch parcial conservando los otros campos. Si la fila queda vacía
// (sin saved y sin rating), se borra para no dejar interacciones huérfanas.
async function patchInteraction(recommendationId: string, patch: Patch) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: current } = await supabase
    .from('user_interactions')
    .select('saved, rating')
    .eq('user_id', user.id)
    .eq('recommendation_id', recommendationId)
    .maybeSingle();

  const next = {
    saved: patch.saved !== undefined ? patch.saved : (current?.saved ?? false),
    rating:
      patch.rating !== undefined ? patch.rating : (current?.rating ?? null),
  };

  if (!next.saved && next.rating === null) {
    if (current) {
      await supabase
        .from('user_interactions')
        .delete()
        .eq('user_id', user.id)
        .eq('recommendation_id', recommendationId);
    }
    revalidatePath('/');
    return;
  }

  if (current) {
    await supabase
      .from('user_interactions')
      .update(next)
      .eq('user_id', user.id)
      .eq('recommendation_id', recommendationId);
  } else {
    await supabase.from('user_interactions').insert({
      user_id: user.id,
      recommendation_id: recommendationId,
      saved: next.saved,
      rating: next.rating,
    });
  }
  revalidatePath('/');
}

export async function setSaved(recommendationId: string, saved: boolean) {
  await patchInteraction(recommendationId, { saved });
}

export async function setRating(
  recommendationId: string,
  rating: number | null,
) {
  if (rating !== null && ![-1, 1, 2].includes(rating)) return;
  await patchInteraction(recommendationId, { rating });
}
