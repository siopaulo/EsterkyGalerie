-- =============================================================
-- Esterky Fotky – inicializační migrace
-- =============================================================
-- Bezpečnost:
--  * RLS zapnuto všude.
--  * Veřejné čtení povoleno pouze pro viditelná data.
--  * Zápis výhradně přihlášeným uživatelům (admin = auth.users).
--  * Kontaktní zprávy smí vkládat anonymní klient, ale nečte je.
-- Robustnost:
--  * Soft-delete fotek (deleted_at).
--  * asset_references jako defenzivní tracking pro blbuvzdorné mazání.
--  * Bloky v jsonb – aplikační Zod validace + defenzivní render.
-- =============================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";
create extension if not exists "unaccent";

-- ---------- enums ----------
do $$ begin
  create type photo_visibility as enum ('public', 'hidden');
exception when duplicate_object then null; end $$;

do $$ begin
  create type asset_kind as enum ('story_block', 'page_block', 'story_cover', 'featured_home', 'site_setting');
exception when duplicate_object then null; end $$;

-- ---------- helpers ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- =============================================================
-- site_settings (vždy 1 řádek, id = 1)
-- =============================================================
create table if not exists public.site_settings (
  id                 smallint primary key default 1,
  site_name          text not null default 'Esterky Fotky',
  site_tagline       text default 'Fotografie s duší koně',
  default_seo_title  text default 'Esterky Fotky – fotografie s duší koně',
  default_seo_description text default 'Editorial foto portfolio zaměřené na koně, portréty a přírodu.',
  contact_email_public text default 'kontakt@domena.cz',
  contact_email_delivery_target text,
  phone              text,
  instagram_url      text,
  facebook_url       text,
  address            text,
  logo_url           text,
  hero_texts         jsonb default '{}'::jsonb,
  featured_photo_ids uuid[] default '{}',
  featured_story_ids uuid[] default '{}',
  updated_at         timestamptz not null default now(),
  constraint singleton_row check (id = 1)
);

create trigger trg_site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

-- =============================================================
-- tags
-- =============================================================
create table if not exists public.tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_tags_name_trgm on public.tags using gin (name gin_trgm_ops);

-- =============================================================
-- photos (centrální knihovna)
-- =============================================================
create table if not exists public.photos (
  id                  uuid primary key default gen_random_uuid(),
  cloudinary_public_id text not null unique,
  original_filename   text,
  display_name        text not null,
  alt_text            text not null default '',
  description         text,
  visibility          photo_visibility not null default 'public',
  width               integer,
  height              integer,
  bytes               integer,
  format              text,
  dominant_color      text,
  blur_data_url       text,
  is_featured_home    boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create index if not exists idx_photos_visibility on public.photos (visibility) where deleted_at is null;
create index if not exists idx_photos_featured on public.photos (is_featured_home) where deleted_at is null and visibility = 'public';
create index if not exists idx_photos_created_at on public.photos (created_at desc);
create index if not exists idx_photos_display_name_trgm on public.photos using gin (display_name gin_trgm_ops);
create index if not exists idx_photos_description_trgm on public.photos using gin (description gin_trgm_ops);

create trigger trg_photos_updated_at
before update on public.photos
for each row execute function public.set_updated_at();

-- =============================================================
-- photo_tags
-- =============================================================
create table if not exists public.photo_tags (
  photo_id uuid not null references public.photos(id) on delete cascade,
  tag_id   uuid not null references public.tags(id) on delete cascade,
  primary key (photo_id, tag_id)
);

create index if not exists idx_photo_tags_tag on public.photo_tags (tag_id);

-- =============================================================
-- stories
-- =============================================================
create table if not exists public.stories (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  excerpt         text,
  cover_photo_id  uuid references public.photos(id) on delete set null,
  published_at    timestamptz not null default now(),
  seo_title       text,
  seo_description text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_stories_published_at on public.stories (published_at desc);
create index if not exists idx_stories_title_trgm on public.stories using gin (title gin_trgm_ops);
create index if not exists idx_stories_excerpt_trgm on public.stories using gin (excerpt gin_trgm_ops);

create trigger trg_stories_updated_at
before update on public.stories
for each row execute function public.set_updated_at();

-- =============================================================
-- story_blocks
-- =============================================================
create table if not exists public.story_blocks (
  id         uuid primary key default gen_random_uuid(),
  story_id   uuid not null references public.stories(id) on delete cascade,
  block_type text not null,
  sort_order integer not null default 0,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_story_blocks_story on public.story_blocks (story_id, sort_order);

create trigger trg_story_blocks_updated_at
before update on public.story_blocks
for each row execute function public.set_updated_at();

-- =============================================================
-- story_tags
-- =============================================================
create table if not exists public.story_tags (
  story_id uuid not null references public.stories(id) on delete cascade,
  tag_id   uuid not null references public.tags(id) on delete cascade,
  primary key (story_id, tag_id)
);

create index if not exists idx_story_tags_tag on public.story_tags (tag_id);

-- =============================================================
-- pages (statické stránky)
-- =============================================================
create table if not exists public.pages (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  seo_title       text,
  seo_description text,
  intro           text,
  updated_at      timestamptz not null default now()
);

create trigger trg_pages_updated_at
before update on public.pages
for each row execute function public.set_updated_at();

-- =============================================================
-- page_blocks
-- =============================================================
create table if not exists public.page_blocks (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid not null references public.pages(id) on delete cascade,
  block_type text not null,
  sort_order integer not null default 0,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_page_blocks_page on public.page_blocks (page_id, sort_order);

create trigger trg_page_blocks_updated_at
before update on public.page_blocks
for each row execute function public.set_updated_at();

-- =============================================================
-- pricing_items
-- =============================================================
create table if not exists public.pricing_items (
  id          uuid primary key default gen_random_uuid(),
  section     text not null default 'default',
  title       text not null,
  description text,
  price_label text,
  features    jsonb not null default '[]'::jsonb,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_pricing_items_sort on public.pricing_items (section, sort_order);

create trigger trg_pricing_items_updated_at
before update on public.pricing_items
for each row execute function public.set_updated_at();

-- =============================================================
-- contact_messages
-- =============================================================
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text,
  subject    text,
  message    text not null,
  consent    boolean not null default false,
  ip_hash    text,
  user_agent text,
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_contact_messages_created_at on public.contact_messages (created_at desc);
create index if not exists idx_contact_messages_handled on public.contact_messages (handled, created_at desc);

-- =============================================================
-- asset_references (defenzivní tracking použití fotek)
-- =============================================================
create table if not exists public.asset_references (
  id         uuid primary key default gen_random_uuid(),
  photo_id   uuid not null references public.photos(id) on delete cascade,
  kind       asset_kind not null,
  ref_id     uuid,
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists idx_asset_refs_photo on public.asset_references (photo_id);
create index if not exists idx_asset_refs_kind on public.asset_references (kind, ref_id);

-- =============================================================
-- RLS
-- =============================================================
alter table public.site_settings    enable row level security;
alter table public.tags             enable row level security;
alter table public.photos           enable row level security;
alter table public.photo_tags       enable row level security;
alter table public.stories          enable row level security;
alter table public.story_blocks     enable row level security;
alter table public.story_tags       enable row level security;
alter table public.pages            enable row level security;
alter table public.page_blocks      enable row level security;
alter table public.pricing_items    enable row level security;
alter table public.contact_messages enable row level security;
alter table public.asset_references enable row level security;

-- Public read politiky
create policy "public read site_settings" on public.site_settings
  for select using (true);

create policy "public read tags" on public.tags
  for select using (true);

create policy "public read photos" on public.photos
  for select using (visibility = 'public' and deleted_at is null);

create policy "public read photo_tags" on public.photo_tags
  for select using (true);

create policy "public read stories" on public.stories
  for select using (published_at <= now());

create policy "public read story_blocks" on public.story_blocks
  for select using (true);

create policy "public read story_tags" on public.story_tags
  for select using (true);

create policy "public read pages" on public.pages
  for select using (true);

create policy "public read page_blocks" on public.page_blocks
  for select using (true);

create policy "public read pricing_items" on public.pricing_items
  for select using (true);

-- Authenticated (admin) full access – single-admin setup;
-- pro budoucí rozšíření lze nahradit kontrolou role v JWT.
create policy "auth all site_settings" on public.site_settings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth all tags" on public.tags
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth all photos" on public.photos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth all photo_tags" on public.photo_tags
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth all stories" on public.stories
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth all story_blocks" on public.story_blocks
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth all story_tags" on public.story_tags
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth all pages" on public.pages
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth all page_blocks" on public.page_blocks
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth all pricing_items" on public.pricing_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth all contact_messages" on public.contact_messages
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth all asset_references" on public.asset_references
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Anonymní klient smí pouze vkládat contact_messages (server-side to validujeme a posíláme).
-- Pro vyšší bezpečnost můžeš insert omezit jen na service_role – viz README.
create policy "anon insert contact_messages" on public.contact_messages
  for insert with check (true);
