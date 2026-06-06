-- Vibes — Row Level Security, grants por columna y permisos de RPC.
-- Modelo: anon sin acceso a tablas; authenticated gobernado por RLS.
-- Privacidad por columna vía grants acotados (email, role, created_by, global_score).

-- ─────────────────────────────────────────────────────────────────────────
-- Habilitar RLS en todas las tablas.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.users             enable row level security;
alter table public.categories        enable row level security;
alter table public.recommendations   enable row level security;
alter table public.user_interactions enable row level security;
alter table public.friendships       enable row level security;
alter table public.invitation_tokens enable row level security;

-- ─────────────────────────────────────────────────────────────────────────
-- anon no tiene acceso directo a ninguna tabla de datos.
-- ─────────────────────────────────────────────────────────────────────────
revoke all on public.users             from anon;
revoke all on public.categories        from anon;
revoke all on public.recommendations   from anon;
revoke all on public.user_interactions from anon;
revoke all on public.friendships       from anon;
revoke all on public.invitation_tokens from anon;

-- ─────────────────────────────────────────────────────────────────────────
-- Grants por columna para authenticated (la RLS filtra filas encima).
-- ─────────────────────────────────────────────────────────────────────────
-- users: email nunca se expone (vive en la sesión auth); role no editable por cliente.
revoke all on public.users from authenticated;
grant select (id, username, role, is_searchable, language, use_affinity_scoring, created_at)
  on public.users to authenticated;
grant update (username, is_searchable, language, use_affinity_scoring)
  on public.users to authenticated;

-- categories.
revoke all on public.categories from authenticated;
grant select, insert, update, delete on public.categories to authenticated;

-- recommendations: created_by oculto; global_score lo gestiona el trigger (no insertable).
revoke all on public.recommendations from authenticated;
grant select (id, title, description, category_id, global_score, created_at)
  on public.recommendations to authenticated;
grant insert (title, description, category_id, created_by)
  on public.recommendations to authenticated;

-- user_interactions.
revoke all on public.user_interactions from authenticated;
grant select on public.user_interactions to authenticated;
grant insert (user_id, recommendation_id, status, rating)
  on public.user_interactions to authenticated;
grant update (status, rating) on public.user_interactions to authenticated;
grant delete on public.user_interactions to authenticated;

-- friendships: insert/delete solo vía RPC (add_friend/remove_friend). Cliente solo edita afinidad.
revoke all on public.friendships from authenticated;
grant select on public.friendships to authenticated;
grant update (affinity) on public.friendships to authenticated;

-- invitation_tokens.
revoke all on public.invitation_tokens from authenticated;
grant select on public.invitation_tokens to authenticated;
grant insert (generated_by) on public.invitation_tokens to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- Políticas RLS.
-- ─────────────────────────────────────────────────────────────────────────

-- users: fila propia, perfiles buscables, o amigos del llamante.
create policy users_select on public.users
  for select to authenticated
  using (
    id = auth.uid()
    or is_searchable
    or exists (
      select 1 from public.friendships f
      where f.user_id = auth.uid() and f.friend_id = users.id
    )
  );

create policy users_update_own on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- categories: lectura para todos; escritura solo admin.
create policy categories_select on public.categories
  for select to authenticated using (true);

create policy categories_admin_insert on public.categories
  for insert to authenticated with check (public.is_admin());

create policy categories_admin_update on public.categories
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy categories_admin_delete on public.categories
  for delete to authenticated using (public.is_admin());

-- recommendations: catálogo neutro de lectura global; alta append-only del propio usuario.
create policy recommendations_select on public.recommendations
  for select to authenticated using (true);

create policy recommendations_insert on public.recommendations
  for insert to authenticated with check (created_by = auth.uid());

-- user_interactions: propias, o las 'completed' de amigos (para feeds y scoring).
create policy user_interactions_select on public.user_interactions
  for select to authenticated
  using (
    user_id = auth.uid()
    or (
      status = 'completed'
      and exists (
        select 1 from public.friendships f
        where f.user_id = auth.uid() and f.friend_id = user_interactions.user_id
      )
    )
  );

create policy user_interactions_insert on public.user_interactions
  for insert to authenticated with check (user_id = auth.uid());

create policy user_interactions_update on public.user_interactions
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy user_interactions_delete on public.user_interactions
  for delete to authenticated using (user_id = auth.uid());

-- friendships: solo las afinidades salientes del llamante.
create policy friendships_select on public.friendships
  for select to authenticated using (user_id = auth.uid());

create policy friendships_update on public.friendships
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- invitation_tokens: solo los generados por el llamante.
create policy invitation_tokens_select on public.invitation_tokens
  for select to authenticated using (generated_by = auth.uid());

create policy invitation_tokens_insert on public.invitation_tokens
  for insert to authenticated with check (generated_by = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────
-- Permisos de ejecución de RPCs (solo authenticated).
-- ─────────────────────────────────────────────────────────────────────────
revoke execute on function public.add_friend(uuid)                       from public, anon;
revoke execute on function public.remove_friend(uuid)                    from public, anon;
revoke execute on function public.organizar_quedada(uuid[])              from public, anon;
revoke execute on function public.find_similar_recommendations(text, real) from public, anon;

grant execute on function public.add_friend(uuid)                        to authenticated;
grant execute on function public.remove_friend(uuid)                     to authenticated;
grant execute on function public.organizar_quedada(uuid[])               to authenticated;
grant execute on function public.find_similar_recommendations(text, real) to authenticated;
