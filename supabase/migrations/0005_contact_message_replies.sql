-- Historie odeslaných odpovědí z adminu na kontaktní zprávy (vlákna přes Re:).

create table if not exists public.contact_message_replies (
  id                   uuid primary key default gen_random_uuid(),
  contact_message_id   uuid references public.contact_messages (id) on delete set null,
  to_email             text not null,
  subject              text not null,
  body                 text not null,
  created_at           timestamptz not null default now()
);

create index if not exists idx_contact_message_replies_message
  on public.contact_message_replies (contact_message_id);

create index if not exists idx_contact_message_replies_created
  on public.contact_message_replies (created_at desc);

alter table public.contact_message_replies enable row level security;

-- Stejný model jako ostatní admin tabulky: plný přístup pro přihlášeného admina.
create policy "auth all contact_message_replies" on public.contact_message_replies
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
