'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function addFriend(targetId: string) {
  const supabase = await createClient();
  await supabase.rpc('add_friend', { target_id: targetId });
  revalidatePath('/friends');
}

export async function updateAffinity(friendId: string, affinity: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  if (Number.isNaN(affinity)) return;
  const clamped = Math.max(0, Math.min(10, affinity));

  await supabase
    .from('friendships')
    .update({ affinity: clamped })
    .eq('user_id', user.id)
    .eq('friend_id', friendId);

  revalidatePath('/friends');
}

export async function removeFriend(targetId: string) {
  const supabase = await createClient();
  await supabase.rpc('remove_friend', { target_id: targetId });
  revalidatePath('/friends');
}
