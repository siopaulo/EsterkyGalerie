-- =============================================================
-- Stránka „Ochrana osobních údajů" – seed default bloků.
--
-- Stejný idempotentní pattern jako 0003 / 0004 / 0007:
--   * stránka už typicky existuje ze seed.sql (viz `pages` insert),
--     ale insert je pojištěn `on conflict do nothing` – migrace je
--     proto bezpečná i na čisté DB bez seedu.
--   * Bloky se vkládají JEN když stránka aktuálně nemá žádné.
--     Re-run migrace tak nepřepíše ruční edit admina.
--   * Žádné nové tabulky, žádné nové block typy – využíváme stávající
--     `rich_text` engine; vykreslí se v `prose-editorial` typografii,
--     která dříve renderovala hardcoded fallback (1:1 vizuálně).
--
-- Obsah seedovaného bloku = doslova text, který stránka dříve měla
-- jako hardcoded fallback. Tím nedojde ke ztrátě obsahu při odstranění
-- fallbacku v App Routeru – admin pak může text upravit ve Studiu.
-- =============================================================

insert into public.pages (slug, title, seo_title, seo_description, intro)
values (
  'ochrana-osobnich-udaju',
  'Ochrana osobních údajů',
  'Ochrana osobních údajů',
  'Informace o zpracování osobních údajů na tomto webu.',
  'Tento dokument popisuje, jak nakládám s osobními údaji návštěvníků a klientů.'
)
on conflict (slug) do nothing;

do $$
declare
  v_page_id uuid;
  v_count   int;
begin
  select id into v_page_id from public.pages where slug = 'ochrana-osobnich-udaju';
  if v_page_id is null then
    return;
  end if;

  select count(*) into v_count from public.page_blocks where page_id = v_page_id;
  if v_count > 0 then
    return;
  end if;

  insert into public.page_blocks (page_id, sort_order, block_type, payload) values
  (
    v_page_id,
    0,
    'rich_text',
    jsonb_build_object(
      'html',
      '<p>Tento text popisuje, jak nakládám s osobními údaji návštěvníků webu a klientů. Vaše údaje zpracovávám pouze v rozsahu nezbytném pro plnění dohodnuté služby a komunikaci.</p>'
      || '<h2 class="mt-8 font-serif text-2xl">Jaké údaje zpracovávám</h2>'
      || '<p>Jméno, e-mail, případně telefon a obsah zprávy z kontaktního formuláře.</p>'
      || '<h2 class="mt-8 font-serif text-2xl">Proč je zpracovávám</h2>'
      || '<p>Pro odpověď na Váš dotaz a případnou realizaci focení.</p>'
      || '<h2 class="mt-8 font-serif text-2xl">Jak dlouho je uchovávám</h2>'
      || '<p>Pouze po dobu nutnou k vyřízení poptávky, nejdéle 3 roky.</p>'
      || '<h2 class="mt-8 font-serif text-2xl">Vaše práva</h2>'
      || '<p>Máte právo na přístup, opravu, výmaz a námitku proti zpracování. Kontakt pro uplatnění najdete v sekci Kontakt.</p>'
    )
  );
end $$;
