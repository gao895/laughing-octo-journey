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
