-- El alta ahora respeta el idioma del navegador (raw_user_meta_data.language) si es válido.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text := new.raw_user_meta_data ->> 'username';
  v_token    uuid := nullif(new.raw_user_meta_data ->> 'invite_token', '')::uuid;
  v_language text := lower(coalesce(new.raw_user_meta_data ->> 'language', ''));
  v_host     uuid;
begin
  if v_username is null or length(trim(v_username)) = 0 then
    raise exception 'username es obligatorio en el alta';
  end if;

  if v_language not in ('en', 'es', 'fr', 'pt') then
    v_language := 'en';
  end if;

  -- Admin semilla: bypass de token.
  if new.email = 'admin@example.com' then
    insert into public.users (id, email, username, role, language)
    values (new.id, new.email, v_username, 'admin', v_language::public.app_language);
    return new;
  end if;

  if v_token is null then
    raise exception 'invite_token es obligatorio';
  end if;

  select generated_by into v_host
  from public.invitation_tokens
  where token = v_token and is_used = false and expires_at > now()
  for update;

  if v_host is null then
    raise exception 'invite_token inválido, usado o expirado';
  end if;

  insert into public.users (id, email, username, role, language)
  values (new.id, new.email, v_username, 'user', v_language::public.app_language);

  update public.invitation_tokens
  set is_used = true
  where token = v_token;

  insert into public.friendships (user_id, friend_id) values
    (new.id, v_host),
    (v_host, new.id)
  on conflict do nothing;

  return new;
end;
$$;
