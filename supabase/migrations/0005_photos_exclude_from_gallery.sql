-- Allow photos to be public but not listed in /galerie.
alter table public.photos
  add column if not exists exclude_from_gallery boolean not null default false;

create index if not exists idx_photos_exclude_from_gallery
  on public.photos (exclude_from_gallery)
  where deleted_at is null and visibility = 'public';

