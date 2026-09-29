-- 作者名 (creator name) per exhibition, and optionally per artwork for group shows.
-- NULL means "use the default": the owner's display name, or the exhibition's 作者名.
alter table public.galleries
  add column if not exists artist_name text check (char_length(artist_name) <= 50);

alter table public.artworks
  add column if not exists artist_name text check (char_length(artist_name) <= 50);
