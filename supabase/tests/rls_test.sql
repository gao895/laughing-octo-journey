-- =====================================================================
-- Row Level Security tests (run by scripts/test-db.sh after the migrations).
-- Alice and Bob are creators; "anon" is a visitor who is not signed in.
-- Any failed expectation raises an error and stops the run.
-- =====================================================================
\set ON_ERROR_STOP 1
\set QUIET 1

create schema if not exists test;
grant usage on schema test to anon, authenticated;

-- Runs a statement and expects the database to refuse it.
create or replace function test.expect_denied(label text, q text) returns void
language plpgsql as $$
begin
  begin
    execute q;
  exception
    when insufficient_privilege or check_violation or foreign_key_violation
      or invalid_text_representation or not_null_violation then
      raise notice 'ok  %', label;
      return;
  end;
  raise exception 'FAIL (was allowed): %', label;
end $$;

-- Runs a statement and returns how many rows it touched.
create or replace function test.affected(q text) returns int
language plpgsql as $$
declare n int;
begin
  execute q;
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function test.check(label text, ok boolean) returns void
language plpgsql as $$
begin
  if ok is not true then raise exception 'FAIL: %', label; end if;
  raise notice 'ok  %', label;
end $$;

grant execute on all functions in schema test to anon, authenticated;

-- ---------------------------------------------------------------- setup (as admin)
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'alice@example.com', '{"display_name":"Alice"}'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'bob@example.com', '{}');

select test.check('signup trigger creates profiles', (select count(*) from public.profiles) = 2);
select test.check('display name from sign-up form',
  (select display_name from public.profiles where user_id = 'aaaaaaaa-0000-4000-8000-000000000001') = 'Alice');
select test.check('display name falls back to the email name',
  (select display_name from public.profiles where user_id = 'bbbbbbbb-0000-4000-8000-000000000002') = 'bob');

-- ---------------------------------------------------------------- Alice
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000001"}', false);

insert into public.galleries (id, user_id, title, slug, template, status, artist_name)
values
  ('a0000000-0000-4000-8000-00000000000a', 'aaaaaaaa-0000-4000-8000-000000000001', '星空の記憶', 'hoshizora-abc123', 'starlight', 'published', '星野みずき'),
  ('a0000000-0000-4000-8000-00000000000b', 'aaaaaaaa-0000-4000-8000-000000000001', '下書き展', 'draft-abc123', 'forest', 'draft', null);
select test.check('Alice creates her galleries', (select count(*) from public.galleries) = 2);

insert into public.artworks (gallery_id, title, image_url, thumbnail_url, media_type, video_url, artist_name)
values
  ('a0000000-0000-4000-8000-00000000000a', '星降る丘', 'https://x/a.webp', 'https://x/a_t.webp', 'image', null, null),
  ('a0000000-0000-4000-8000-00000000000a', '流れ星', 'https://x/b.webp', 'https://x/b_t.webp', 'video', 'https://x/b.mp4', 'ゲスト作家'),
  ('a0000000-0000-4000-8000-00000000000b', '秘密の作品', 'https://x/c.webp', 'https://x/c_t.webp', 'image', null, null);
select test.check('Alice adds artworks (image + video)', (select count(*) from public.artworks) = 3);

update public.galleries set settings = '{"wallColor":"#1f2a44","frameStyle":"gold","backdrop":"canal"}'
  where id = 'a0000000-0000-4000-8000-00000000000a';
select test.check('Alice updates her gallery settings',
  (select settings ->> 'backdrop' from public.galleries where id = 'a0000000-0000-4000-8000-00000000000a') = 'canal');

update public.profiles set display_name = '星野みずき', bio = '夜空の絵を描いています', avatar_url = 'https://x/p.webp'
  where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
select test.check('Alice edits her own profile',
  (select bio from public.profiles where user_id = 'aaaaaaaa-0000-4000-8000-000000000001') = '夜空の絵を描いています');

-- Upsert path used by the app (profile row already exists -> update)
insert into public.profiles (user_id, display_name) values ('aaaaaaaa-0000-4000-8000-000000000001', '星野みずき')
  on conflict (user_id) do update set display_name = excluded.display_name;

-- Storage: own gallery folder and own profile folder are allowed
insert into storage.objects (bucket_id, name) values
  ('gallery-assets', 'aaaaaaaa-0000-4000-8000-000000000001/a0000000-0000-4000-8000-00000000000a/art.webp'),
  ('gallery-assets', 'aaaaaaaa-0000-4000-8000-000000000001/a0000000-0000-4000-8000-00000000000a/clip.mp4'),
  ('gallery-assets', 'aaaaaaaa-0000-4000-8000-000000000001/profile/avatar-1.webp');
select test.check('Alice uploads to her gallery and profile folders',
  (select count(*) from storage.objects) = 3);

select test.expect_denied('Alice cannot upload into a folder that is not a gallery of hers',
  $q$insert into storage.objects (bucket_id, name) values ('gallery-assets', 'aaaaaaaa-0000-4000-8000-000000000001/not-a-gallery/x.webp')$q$);
select test.expect_denied('Alice cannot upload into Bob''s folder',
  $q$insert into storage.objects (bucket_id, name) values ('gallery-assets', 'bbbbbbbb-0000-4000-8000-000000000002/profile/x.webp')$q$);
select test.expect_denied('gallery for someone else is refused',
  $q$insert into public.galleries (user_id, title, slug) values ('bbbbbbbb-0000-4000-8000-000000000002', 'x', 'spoof-abc123')$q$);
select test.expect_denied('invalid slug is refused',
  $q$insert into public.galleries (user_id, title, slug) values ('aaaaaaaa-0000-4000-8000-000000000001', 'x', '../etc')$q$);
select test.expect_denied('unknown venue is refused',
  $q$insert into public.galleries (user_id, title, slug, template) values ('aaaaaaaa-0000-4000-8000-000000000001', 'x', 'v-abc123', 'moon-base')$q$);
select test.expect_denied('title longer than 60 characters is refused',
  $q$insert into public.galleries (user_id, title, slug) values ('aaaaaaaa-0000-4000-8000-000000000001', repeat('あ', 61), 'long-abc123')$q$);
select test.expect_denied('artist name longer than 50 characters is refused',
  $q$update public.galleries set artist_name = repeat('あ', 51) where id = 'a0000000-0000-4000-8000-00000000000a'$q$);
select test.expect_denied('unknown media type is refused',
  $q$insert into public.artworks (gallery_id, image_url, thumbnail_url, media_type) values ('a0000000-0000-4000-8000-00000000000a', 'u', 't', 'hologram')$q$);

-- All eight venues are valid
insert into public.galleries (user_id, title, slug, template)
select 'aaaaaaaa-0000-4000-8000-000000000001', t, t || '-v1', t
from unnest(array['white-museum','starlight','japanese','castle-town','forest','seaside','halloween','simple']) as t;
select test.check('all eight venues are accepted',
  (select count(*) from public.galleries where slug like '%-v1') = 8);
delete from public.galleries where slug like '%-v1';

reset role;

-- ---------------------------------------------------------------- Bob
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-4000-8000-000000000002"}', false);

select test.check('Bob sees Alice''s published gallery',
  exists (select 1 from public.galleries where id = 'a0000000-0000-4000-8000-00000000000a'));
select test.check('Bob does NOT see Alice''s draft',
  not exists (select 1 from public.galleries where id = 'a0000000-0000-4000-8000-00000000000b'));
select test.check('Bob sees only the published artworks',
  (select count(*) from public.artworks) = 2);
select test.check('Bob cannot change Alice''s gallery (0 rows)',
  test.affected($q$update public.galleries set title = 'hacked' where id = 'a0000000-0000-4000-8000-00000000000a'$q$) = 0);
select test.check('Bob cannot delete Alice''s artworks (0 rows)',
  test.affected($q$delete from public.artworks$q$) = 0);
select test.check('Bob cannot edit Alice''s profile (0 rows)',
  test.affected($q$update public.profiles set bio = 'hacked' where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'$q$) = 0);
select test.expect_denied('Bob cannot add artworks to Alice''s gallery',
  $q$insert into public.artworks (gallery_id, image_url, thumbnail_url) values ('a0000000-0000-4000-8000-00000000000a', 'u', 't')$q$);
select test.expect_denied('Bob cannot move his artwork into Alice''s gallery',
  $q$insert into public.artworks (gallery_id, image_url, thumbnail_url) values ('a0000000-0000-4000-8000-00000000000b', 'u', 't')$q$);
select test.expect_denied('Bob cannot upload into Alice''s gallery folder',
  $q$insert into storage.objects (bucket_id, name) values ('gallery-assets', 'aaaaaaaa-0000-4000-8000-000000000001/a0000000-0000-4000-8000-00000000000a/x.webp')$q$);
select test.expect_denied('Bob cannot upload into his folder using Alice''s gallery id',
  $q$insert into storage.objects (bucket_id, name) values ('gallery-assets', 'bbbbbbbb-0000-4000-8000-000000000002/a0000000-0000-4000-8000-00000000000a/x.webp')$q$);
select test.check('Bob cannot delete Alice''s files (0 rows)',
  test.affected($q$delete from storage.objects$q$) = 0);
select test.check('Bob cannot read Alice''s visitor records',
  (select count(*) from public.gallery_visits) = 0);

-- likes / comments on a published gallery
insert into public.likes (gallery_id, artwork_id, user_id)
select 'a0000000-0000-4000-8000-00000000000a', id, 'bbbbbbbb-0000-4000-8000-000000000002'
from public.artworks where title = '星降る丘';
select test.expect_denied('Bob cannot like in someone''s name',
  $q$insert into public.likes (gallery_id, user_id) values ('a0000000-0000-4000-8000-00000000000a', 'aaaaaaaa-0000-4000-8000-000000000001')$q$);
select test.expect_denied('Bob cannot like a draft',
  $q$insert into public.likes (gallery_id, user_id) values ('a0000000-0000-4000-8000-00000000000b', 'bbbbbbbb-0000-4000-8000-000000000002')$q$);

reset role;

-- ---------------------------------------------------------------- visitor (not signed in)
set role anon;
select set_config('request.jwt.claims', '', false);

select test.check('visitor sees the published gallery',
  (select count(*) from public.galleries) = 1);
select test.check('visitor sees its artworks, including the video',
  (select count(*) from public.artworks where media_type = 'video' and video_url is not null) = 1);
select test.check('visitor sees the creator''s public profile',
  (select bio from public.profiles where user_id = 'aaaaaaaa-0000-4000-8000-000000000001') = '夜空の絵を描いています');

insert into public.gallery_visits (gallery_id, visitor_id) values ('a0000000-0000-4000-8000-00000000000a', 'visitor-1');
select test.expect_denied('visitor cannot record a visit to a draft',
  $q$insert into public.gallery_visits (gallery_id, visitor_id) values ('a0000000-0000-4000-8000-00000000000b', 'v')$q$);
select test.check('visitor cannot read visit records', (select count(*) from public.gallery_visits) = 0);
select test.expect_denied('visitor cannot create galleries',
  $q$insert into public.galleries (user_id, title, slug) values ('aaaaaaaa-0000-4000-8000-000000000001', 'x', 'anon-abc123')$q$);
select test.check('visitor cannot change anything (0 rows)',
  test.affected($q$update public.galleries set title = 'hacked'$q$) = 0);
select test.expect_denied('visitor cannot upload files',
  $q$insert into storage.objects (bucket_id, name) values ('gallery-assets', 'aaaaaaaa-0000-4000-8000-000000000001/profile/x.webp')$q$);

reset role;

-- ---------------------------------------------------------------- Alice again
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000001"}', false);
select test.check('Alice reads visits to her gallery', (select count(*) from public.gallery_visits) = 1);
select test.check('Alice deletes her draft (artworks cascade)',
  test.affected($q$delete from public.galleries where id = 'a0000000-0000-4000-8000-00000000000b'$q$) = 1);
reset role;
select test.check('cascade removed the draft''s artworks',
  not exists (select 1 from public.artworks where title = '秘密の作品'));

-- ---------------------------------------------------------------- storage bucket
select test.check('bucket allows MP4 / MOV / images / audio and 50MB',
  (select file_size_limit = 52428800
      and allowed_mime_types @> array['video/mp4','video/quicktime','video/x-m4v','image/webp','audio/mpeg']
   from storage.buckets where id = 'gallery-assets'));

\echo 'ALL RLS TESTS PASSED'
