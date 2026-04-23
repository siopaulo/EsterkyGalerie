-- =============================================================
-- Esterky Fotky – reviews (veřejné reference)
-- =============================================================
-- Veřejný formulář reference → řádek vzniká jako `approved = false`.
-- Admin schválí → veřejně viditelné.
--
-- Bezpečnost:
--  * RLS zapnuto.
--  * Public SELECT pouze schválené (approved = true).
--  * Žádný anon INSERT policy – insert jde výhradně přes service-role
--    (API route /api/reviews) po Turnstile + rate-limit + honeypot.
--  * Authenticated (admin) má full access.
-- =============================================================

create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  rating     smallint not null,
  message    text,
  approved   boolean not null default false,
  ip_hash    text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_rating_range check (rating between 1 and 5),
  constraint reviews_name_len     check (name is null or char_length(name) <= 120),
  constraint reviews_message_len  check (message is null or char_length(message) <= 2000)
);

-- Veřejný list (approved = true) řazený od nejnovější.
create index if not exists idx_reviews_approved_created_at
  on public.reviews (approved, created_at desc);

-- Admin list – všechny, od nejnovější.
create index if not exists idx_reviews_created_at
  on public.reviews (created_at desc);

-- Rychlý summary count.
create index if not exists idx_reviews_approved
  on public.reviews (approved);

create trigger trg_reviews_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

-- ---------- RLS ----------
alter table public.reviews enable row level security;

-- Veřejně čteme jen schválené.
create policy "public read approved reviews"
  on public.reviews
  for select
  using (approved = true);

-- Admin (authenticated) plný přístup.
create policy "auth all reviews"
  on public.reviews
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
