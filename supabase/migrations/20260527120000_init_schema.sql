-- Vibes — Esquema base: extensiones, enums, tablas, constraints e índices.
-- Fuente de verdad: product-design.md + security-design.md.

-- Extensiones (pg_trgm para deduplicación difusa).
create extension if not exists pg_trgm with schema extensions;

-- Enums.
create type public.user_role as enum ('user', 'admin');
create type public.app_language as enum ('en', 'es', 'fr', 'pt');
create type public.interaction_status as enum ('saved', 'completed');

-- users: espejo de auth.users con datos de perfil.
create table public.users (
  id                   uuid primary key references auth.users (id) on delete cascade,
  email                text not null,
  username             text not null unique,
  role                 public.user_role not null default 'user',
  is_searchable        boolean not null default true,
  language             public.app_language not null default 'en',
  use_affinity_scoring boolean not null default false,
  created_at           timestamptz not null default now()
);

-- categories: catálogo fijo global, solo admin escribe.
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  icon       text,
  color      text check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now()
);

-- recommendations: catálogo neutro append-only. created_by solo para auditoría interna.
create table public.recommendations (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  category_id  uuid not null references public.categories (id),
  global_score integer not null default 0,
  created_by   uuid not null references public.users (id),
  created_at   timestamptz not null default now()
);

-- user_interactions: estado por usuario (saved | completed) con rating obligatorio si completed.
create table public.user_interactions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users (id) on delete cascade,
  recommendation_id uuid not null references public.recommendations (id) on delete cascade,
  status            public.interaction_status not null,
  rating            integer,
  updated_at        timestamptz not null default now(),
  unique (user_id, recommendation_id),
  constraint rating_matches_status check (
    (status = 'saved'     and rating is null) or
    (status = 'completed' and rating in (-1, 1, 2))
  )
);

-- friendships: relación dirigida y asimétrica. PK compuesta crea ya el índice (user_id, friend_id).
create table public.friendships (
  user_id    uuid not null references public.users (id) on delete cascade,
  friend_id  uuid not null references public.users (id) on delete cascade,
  affinity   numeric not null default 5.0 check (affinity between 0 and 10),
  updated_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  constraint no_self_friendship check (user_id <> friend_id)
);

-- invitation_tokens: alta invite-only.
create table public.invitation_tokens (
  id           uuid primary key default gen_random_uuid(),
  token        uuid not null unique default gen_random_uuid(),
  generated_by uuid not null references public.users (id) on delete cascade,
  is_used      boolean not null default false,
  expires_at   timestamptz not null default (now() + interval '7 days'),
  created_at   timestamptz not null default now()
);

-- Índices críticos.
-- Árbol de decisión de la Home y filtrado por lote en "Organizar Quedada".
create index idx_user_interactions_user_status_rec
  on public.user_interactions (user_id, status, recommendation_id);

-- Tendencias globales (orden DESC, admite negativos de forma natural).
create index idx_recommendations_global_score
  on public.recommendations (global_score desc);

-- Auditoría/depuración del admin.
create index idx_recommendations_created_by
  on public.recommendations (created_by);

-- Deduplicación difusa de títulos y nombres de categoría.
create index idx_recommendations_title_trgm
  on public.recommendations using gin (title extensions.gin_trgm_ops);
create index idx_categories_name_trgm
  on public.categories using gin (name extensions.gin_trgm_ops);

-- Búsquedas inversas de amistad (remove_friend, feeds).
create index idx_friendships_friend_id
  on public.friendships (friend_id);
