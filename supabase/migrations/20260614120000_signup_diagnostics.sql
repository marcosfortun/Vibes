-- Diagnóstico del alta: comprueba si un username está disponible.
-- Accesible por anon para poder hacer la comprobación antes de llamar a signUp,
-- dando un error específico en lugar del genérico unexpected_failure del trigger.
create or replace function public.username_available(u text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.users
    where lower(username) = lower(trim(u))
  );
$$;

revoke execute on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;
