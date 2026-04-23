-- =============================================================
-- Homepage jako modulární stránka s bloky.
-- Slug `_home` je rezervovaný (prefix `_` = systémová stránka,
-- nezobrazuje se v běžném seznamu /app/(site)/[slug]).
-- =============================================================

insert into public.pages (slug, title, intro, seo_title, seo_description)
values ('_home', 'Hlavní stránka', null, null, null)
on conflict (slug) do nothing;

-- Seed default bloků pouze když stránka nemá žádné. Tím ctíme případný
-- ruční edit admina a nechceme jeho práci přepsat při re-runu migrací.
do $$
declare
  v_page_id uuid;
  v_count   int;
begin
  select id into v_page_id from public.pages where slug = '_home';
  if v_page_id is null then
    return;
  end if;

  select count(*) into v_count from public.page_blocks where page_id = v_page_id;
  if v_count > 0 then
    return;
  end if;

  insert into public.page_blocks (page_id, sort_order, block_type, payload) values
  (
    v_page_id, 0, 'home_hero',
    jsonb_build_object(
      'eyebrow', 'Fotografie',
      'title',   'Světlo, kůň, okamžik',
      'subtitle','Portrétní a životní fotografie koní, jezdců a jejich světa. S ohledem na charakter zvířete a atmosféru místa.',
      'cta_primary',   jsonb_build_object('label','Prohlédnout galerii','href','/galerie'),
      'cta_secondary', jsonb_build_object('label','Chci se objednat',  'href','/kontakt'),
      'photo_ids', '[]'::jsonb,
      'auto_rotate_ms', 5000
    )
  ),
  (
    v_page_id, 1, 'home_about',
    jsonb_build_object(
      'eyebrow', 'O autorce',
      'title',   'Fotografie, která stojí za to zvednout ze stolu.',
      'paragraphs', jsonb_build_array(
        'Fotím s citem pro charakter i světlo. Miluju klidné portréty a momenty, které jsou autentické – bez pózy a bez přikrášlení.',
        'Pracuji ráda v plenéru, v mlžných ránech i v tlumeném zimním světle. Jeden den patří jen vám a vašemu koni.'
      ),
      'link_label', 'Víc o mně',
      'link_href',  '/o-mne'
    )
  ),
  (
    v_page_id, 2, 'home_gallery_carousel',
    jsonb_build_object(
      'eyebrow', 'Vybrané fotografie',
      'title',   'Z poslední doby',
      'view_all_label', 'Celá galerie',
      'view_all_href',  '/galerie',
      'use_featured', true,
      'photo_ids', '[]'::jsonb,
      'auto_rotate_ms', 5000,
      'layout', 'editorial'
    )
  ),
  (
    v_page_id, 3, 'home_service_cta',
    jsonb_build_object(
      'eyebrow', 'Služba',
      'title',   'Portrétní focení koní a jezdců',
      'description','Pracuji s jedním zákazníkem po celý den – bez spěchu, s maximem péče a respektu ke zvířeti.',
      'cta_primary',   jsonb_build_object('label','Služby a ceník','href','/sluzby'),
      'cta_secondary', jsonb_build_object('label','Ozvat se',      'href','/kontakt'),
      'background', 'muted'
    )
  ),
  (
    v_page_id, 4, 'home_stories_feed',
    jsonb_build_object(
      'eyebrow', 'Příběhy',
      'title',   'Nejnovější',
      'view_all_label', 'Všechny příběhy',
      'view_all_href',  '/pribehy',
      'count', 3
    )
  );
end $$;
