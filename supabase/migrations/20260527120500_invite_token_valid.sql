-- Validación de token de invitación accesible por anon (para mejor UX en signup).
-- Devuelve solo un booleano: no expone quién generó el token ni datos del mismo.
create or replace function public.invite_token_valid(t uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.invitation_tokens
    where token = t and is_used = false and expires_at > now()
  );
$$;

revoke execute on function public.invite_token_valid(uuid) from public;
grant execute on function public.invite_token_valid(uuid) to anon, authenticated;
