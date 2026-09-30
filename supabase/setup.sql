-- =====================================================================
-- My Virtual Gallery - complete database setup (generated, do not edit)
-- Paste this whole file into Supabase > SQL Editor and press Run.
-- Safe to run again: every step checks what already exists.
-- Source: supabase/migrations/*.sql  (npm run db:setup-sql)
-- =====================================================================

-- >>> 20260929000000_initial_schema.sql
-- =====================================================================
-- My Virtual Gallery - initial schema
-- Run this in the Supabase SQL editor, or with `supabase db push`.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 50),
  avatar_url text,
  bio text check (char_length(bio) <= 500),
  created_at timestamptz not null default now()
);

-- Create a profile automatically when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    left(coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)), 50)
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- galleries
-- ---------------------------------------------------------------------
create table if not exists public.galleries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  description text not null default '' check (char_length(description) <= 1000),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  template text not null default 'white-museum'
    check (template in ('white-museum', 'starlight', 'japanese', 'castle-town', 'forest', 'seaside', 'halloween', 'simple')),
  status text not null default 'draft' check (status in ('draft', 'published', 'private')),
  layout_mode text not null default 'auto' check (layout_mode in ('auto', 'even', 'large', 'manual')),
  lighting text not null default 'standard' check (lighting in ('standard', 'bright', 'soft')),
  cover_image_url text,
  bgm_url text,
  -- Extension point for future features (AI suggestions, wall colours, multiplayer, avatars ...)
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists galleries_user_id_idx on public.galleries (user_id);
create index if not exists galleries_status_idx on public.galleries (status);

-- ---------------------------------------------------------------------
-- artworks
-- ---------------------------------------------------------------------
create table if not exists public.artworks (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries (id) on delete cascade,
  title text not null default '' check (char_length(title) <= 60),
  description text not null default '' check (char_length(description) <= 1000),
  -- image is supported in the MVP; video / model are reserved for future releases.
  media_type text not null default 'image' check (media_type in ('image', 'video', 'model')),
  image_url text not null,
  thumbnail_url text not null,
  width integer not null default 1024 check (width > 0),
  height integer not null default 1024 check (height > 0),
  order_index integer not null default 0,
  position_x double precision,
  position_y double precision,
  position_z double precision,
  rotation_y double precision,
  scale double precision check (scale is null or (scale > 0 and scale <= 5)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists artworks_gallery_id_idx on public.artworks (gallery_id, order_index);

-- ---------------------------------------------------------------------
-- gallery_visits (visitor_id is nullable so anonymous visitors are supported)
-- ---------------------------------------------------------------------
create table if not exists public.gallery_visits (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries (id) on delete cascade,
  visitor_id text check (char_length(visitor_id) <= 64),
  visited_at timestamptz not null default now()
);

create index if not exists gallery_visits_gallery_id_idx on public.gallery_visits (gallery_id);

-- ---------------------------------------------------------------------
-- Future features (tables only; UI comes after the MVP)
-- ---------------------------------------------------------------------
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries (id) on delete cascade,
  artwork_id uuid references public.artworks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (gallery_id, artwork_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references public.artworks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists galleries_set_updated_at on public.galleries;
create trigger galleries_set_updated_at before update on public.galleries
  for each row execute function public.set_updated_at();

drop trigger if exists artworks_set_updated_at on public.artworks;
create trigger artworks_set_updated_at before update on public.artworks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Helper functions for RLS
-- ---------------------------------------------------------------------
create or replace function public.owns_gallery(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.galleries g where g.id = gid and g.user_id = auth.uid());
$$;

create or replace function public.gallery_is_published(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.galleries g where g.id = gid and g.status = 'published');
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.galleries enable row level security;
alter table public.artworks enable row level security;
alter table public.gallery_visits enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;

-- profiles: public display names (shown as 作者名), editable by the owner only.
drop policy if exists "profiles are viewable by everyone" on public.profiles;
create policy "profiles are viewable by everyone" on public.profiles
  for select using (true);
drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile" on public.profiles
  for insert with check (auth.uid() = user_id);
drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- galleries: owners see everything they own; everybody (incl. anon) sees published ones.
drop policy if exists "published galleries are public" on public.galleries;
create policy "published galleries are public" on public.galleries
  for select using (status = 'published' or auth.uid() = user_id);
drop policy if exists "owners can create galleries" on public.galleries;
create policy "owners can create galleries" on public.galleries
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "owners can update galleries" on public.galleries;
create policy "owners can update galleries" on public.galleries
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "owners can delete galleries" on public.galleries;
create policy "owners can delete galleries" on public.galleries
  for delete to authenticated using (auth.uid() = user_id);

-- artworks: visible when the gallery is published or owned; writable by the gallery owner only.
drop policy if exists "artworks follow gallery visibility" on public.artworks;
create policy "artworks follow gallery visibility" on public.artworks
  for select using (public.gallery_is_published(gallery_id) or public.owns_gallery(gallery_id));
drop policy if exists "owners can add artworks" on public.artworks;
create policy "owners can add artworks" on public.artworks
  for insert to authenticated with check (public.owns_gallery(gallery_id));
drop policy if exists "owners can update artworks" on public.artworks;
create policy "owners can update artworks" on public.artworks
  for update to authenticated
  using (public.owns_gallery(gallery_id)) with check (public.owns_gallery(gallery_id));
drop policy if exists "owners can delete artworks" on public.artworks;
create policy "owners can delete artworks" on public.artworks
  for delete to authenticated using (public.owns_gallery(gallery_id));

-- gallery_visits: anyone may record a visit to a published gallery; only owners read them.
drop policy if exists "anyone can record visits to published galleries" on public.gallery_visits;
create policy "anyone can record visits to published galleries" on public.gallery_visits
  for insert with check (public.gallery_is_published(gallery_id));
drop policy if exists "owners can read visits" on public.gallery_visits;
create policy "owners can read visits" on public.gallery_visits
  for select using (public.owns_gallery(gallery_id));

-- likes / comments (future): readable on published galleries, writable by the signed-in author.
drop policy if exists "likes are readable" on public.likes;
create policy "likes are readable" on public.likes
  for select using (public.gallery_is_published(gallery_id) or public.owns_gallery(gallery_id));
drop policy if exists "users can like" on public.likes;
create policy "users can like" on public.likes
  for insert to authenticated
  with check (auth.uid() = user_id and public.gallery_is_published(gallery_id));
drop policy if exists "users can unlike" on public.likes;
create policy "users can unlike" on public.likes
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "comments are readable" on public.comments;
create policy "comments are readable" on public.comments
  for select using (
    exists (
      select 1 from public.artworks a
      where a.id = artwork_id
        and (public.gallery_is_published(a.gallery_id) or public.owns_gallery(a.gallery_id))
    )
  );
drop policy if exists "users can comment" on public.comments;
create policy "users can comment" on public.comments
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.artworks a
      where a.id = artwork_id and public.gallery_is_published(a.gallery_id)
    )
  );
drop policy if exists "users can delete own comments" on public.comments;
create policy "users can delete own comments" on public.comments
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Storage: gallery-assets/{user_id}/{gallery_id}/{asset_id}.webp
-- The bucket is public-read so visitors can load textures without signing in.
-- Paths contain random UUIDs; writes are restricted to the owner's folder.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gallery-assets',
  'gallery-assets',
  true,
  10485760,
  array['image/webp', 'image/jpeg', 'image/png', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/wave']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "gallery assets are publicly readable" on storage.objects;
create policy "gallery assets are publicly readable" on storage.objects
  for select using (bucket_id = 'gallery-assets');

drop policy if exists "owners can upload gallery assets" on storage.objects;
create policy "owners can upload gallery assets" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'gallery-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.owns_gallery(((storage.foldername(name))[2])::uuid)
  );

drop policy if exists "owners can update gallery assets" on storage.objects;
create policy "owners can update gallery assets" on storage.objects
  for update to authenticated
  using (bucket_id = 'gallery-assets' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'gallery-assets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "owners can delete gallery assets" on storage.objects;
create policy "owners can delete gallery assets" on storage.objects
  for delete to authenticated
  using (bucket_id = 'gallery-assets' and (storage.foldername(name))[1] = auth.uid()::text);

-- >>> 20261001000000_artist_names.sql
-- 作者名 (creator name) per exhibition, and optionally per artwork for group shows.
-- NULL means "use the default": the owner's display name, or the exhibition's 作者名.
alter table public.galleries
  add column if not exists artist_name text check (char_length(artist_name) <= 50);

alter table public.artworks
  add column if not exists artist_name text check (char_length(artist_name) <= 50);

-- >>> 20261002000000_video_artworks.sql
-- Video artworks (media_type = 'video'): the MP4 lives in video_url; image_url and
-- thumbnail_url hold its poster frame so thumbnails and loading states keep working.
alter table public.artworks
  add column if not exists video_url text;

-- Allow MP4 uploads. Images stay at 10MB (checked in the app); videos may be up to 50MB.
update storage.buckets
  set file_size_limit = 52428800,
      allowed_mime_types = array[
        'image/webp', 'image/jpeg', 'image/png',
        'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/wave',
        'video/mp4'
      ]
  where id = 'gallery-assets';

-- iPhone videos (MOV / M4V) are accepted as well, so phones need not convert them first.
update storage.buckets
  set allowed_mime_types = array_cat(allowed_mime_types, array['video/quicktime', 'video/x-m4v'])
  where id = 'gallery-assets' and not ('video/quicktime' = any (allowed_mime_types));

-- >>> 20261003000000_profile_avatars.sql
-- プロフィール設定: icon images live at gallery-assets/{user_id}/profile/{file}.
-- The original upload policy casts the second folder to a gallery uuid, which fails
-- for 'profile', so it is replaced by a text-based check.

create or replace function public.owns_gallery_text(gid text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.galleries g where g.id::text = gid and g.user_id = auth.uid());
$$;

drop policy if exists "owners can upload gallery assets" on storage.objects;
create policy "owners can upload gallery assets" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'gallery-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (
      (storage.foldername(name))[2] = 'profile'
      or public.owns_gallery_text((storage.foldername(name))[2])
    )
  );
