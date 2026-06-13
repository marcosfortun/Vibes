-- Skin de interfaz por usuario. El nombre técnico ("style") vive en la BD;
-- el catálogo de skins y sus nombres comerciales viven en el código (src/lib/skins.ts).
--
-- La columna es NULLABLE a propósito: `null` significa "sin fijar". El cliente
-- resuelve la skin (localStorage → preferencia de BD → al azar) y persiste la
-- elección, de modo que un usuario nuevo (skin null) recibe una skin aleatoria
-- la primera vez y queda guardada.
alter table public.users
  add column if not exists skin text;

-- Integridad: null (sin fijar) o un estilo conocido. Al añadir una skin nueva,
-- ampliar este CHECK.
alter table public.users
  drop constraint if exists users_skin_valid;
alter table public.users
  add constraint users_skin_valid
  check (
    skin is null
    or skin in (
      'cyberbotanical',
      'minimal',
      'flat design',
      'neobrutalism',
      'pixel art'
    )
  );

-- El usuario puede leer y editar su propia skin (la RLS users_update_own ya filtra la fila).
grant select (skin) on public.users to authenticated;
grant update (skin) on public.users to authenticated;
