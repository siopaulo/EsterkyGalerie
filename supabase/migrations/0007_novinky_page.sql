-- =============================================================
-- Stránka „Novinky" – využívá existující pages / page_blocks engine.
-- Žádné nové tabulky, žádný separátní news systém.
--
-- Po nasazení:
--  * stránka je dostupná na /novinky (App Router přes catch-all CMS pattern)
--  * v adminu se objeví v /studio/stranky vedle ostatních stránek
--  * obsah je ručně editovatelný stejně jako sluzby / cenik / o-mne
-- =============================================================

insert into public.pages (slug, title, seo_title, seo_description, intro)
values (
  'novinky',
  'Novinky',
  'Novinky',
  'Co je nového – aktuální informace o focení, volné termíny a nové projekty.',
  'Krátké zprávy o tom, co se zrovna děje. Volné termíny, nové projekty, ohlédnutí.'
)
on conflict (slug) do nothing;

-- Default bloky – vložíme jen když stránka nemá žádné. Re-run migrace tak
-- nepřepíše ruční edit admina. Stejný pattern jako u 0003_home_page / 0004_sluzby.
do $$
declare
  v_page_id uuid;
  v_count   int;
begin
  select id into v_page_id from public.pages where slug = 'novinky';
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
    'section_heading',
    jsonb_build_object(
      'eyebrow', 'Aktuálně',
      'title',   'Co je nového',
      'description', 'Krátké zprávy z ateliéru, volné termíny a aktuální nabídky.',
      'align',   'left'
    )
  ),
  (
    v_page_id,
    1,
    'rich_text',
    jsonb_build_object(
      'html',
      '<p><em>Zatím tu nejsou žádné novinky.</em></p><p>Mrkněte zase brzy – nebo mě sledujte na Instagramu, kde sdílím nejvíc.</p>'
    )
  );
end $$;
