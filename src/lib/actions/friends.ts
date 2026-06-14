'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logSupabaseError } from '@/lib/supabase/log';
import { sendFriendshipEmails } from '@/lib/email/resend';

export type AcceptResult = { ok: boolean; error?: 'noSession' | 'cannotSelf' | 'invalid' };

// Acepta una invitación: crea la amistad bidireccional desde un token activo.
// Si la amistad es nueva, notifica por email a ambos (datos leídos con
// service-role, ya que el cliente no puede ver users.email).
export async function acceptInvitation(token: string): Promise<AcceptResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'noSession' };

  const { data, error } = await supabase.rpc('accept_invitation', { t: token });
  if (error) {
    logSupabaseError('acceptInvitation.accept_invitation', error);
    const msg = error.message ?? '';
    if (msg.includes('propia')) return { ok: false, error: 'cannotSelf' };
    return { ok: false, error: 'invalid' };
  }

  const row = data?.[0];
  if (!row) return { ok: false, error: 'invalid' };

  if (row.created) {
    try {
      const admin = createAdminClient();
      const { data: rows } = await admin
        .from('users')
        .select('id, email, username, language')
        .in('id', [user.id, row.host_id]);
      const me = rows?.find((u) => u.id === user.id);
      const host = rows?.find((u) => u.id === row.host_id);
      if (me && host) {
        await sendFriendshipEmails(
          { email: me.email, username: me.username, language: me.language },
          { email: host.email, username: host.username, language: host.language },
        );
      }
    } catch (e) {
      // El email es secundario: nunca debe tumbar la creación de la amistad.
      console.error('[acceptInvitation] fallo al notificar por email', e);
    }
  }

  revalidatePath('/friends');
  return { ok: true };
}

// Devuelve el token activo del llamante, creando uno (48h) si no existe.
export async function ensureInvite(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('ensure_invite');
  logSupabaseError('ensureInvite.ensure_invite', error);
  revalidatePath('/friends');
  return data ?? null;
}

// Revoca el token activo y crea uno nuevo (invalida el anterior).
export async function regenerateInvite(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('regenerate_invite');
  logSupabaseError('regenerateInvite.regenerate_invite', error);
  revalidatePath('/friends');
  return data ?? null;
}

// Revoca el token activo sin crear otro (deja al usuario sin enlace).
export async function revokeInvite(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('revoke_invite');
  logSupabaseError('revokeInvite.revoke_invite', error);
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

  const { error } = await supabase
    .from('friendships')
    .update({ affinity: clamped })
    .eq('user_id', user.id)
    .eq('friend_id', friendId);
  logSupabaseError('updateAffinity.friendships.update', error);

  revalidatePath('/friends');
}

// Elimina la amistad en ambas direcciones (RPC remove_friend).
export async function removeFriend(targetId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc('remove_friend', { target_id: targetId });
  logSupabaseError('removeFriend.remove_friend', error);
  revalidatePath('/friends');
}
