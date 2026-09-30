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
