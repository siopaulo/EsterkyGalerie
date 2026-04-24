-- =============================================================
-- Seed – český placeholder obsah
-- =============================================================

insert into public.site_settings (id, site_name, site_tagline, default_seo_title, default_seo_description,
  contact_email_public, contact_email_delivery_target, phone, instagram_url, facebook_url, hero_texts)
values (
  1,
  'Foto web',
  'Fotografie s duší koně',
  'Fotografie s duší koně',
  'Editorial foto portfolio zaměřené na koně, portréty a přírodu. Autorka Esterka.',
  'kontakt@domena.cz',
  null,
  null,
  null,
  null,
  '{"title":"Světlo, kůň, okamžik","subtitle":"Fotografie, které vypráví tichý příběh. Portréty, koně, příroda.","cta_primary":"Prohlédnout galerii","cta_secondary":"Chci se objednat"}'::jsonb
)
on conflict (id) do nothing;

-- Základní stránky
insert into public.pages (slug, title, seo_title, seo_description, intro) values
  ('o-mne', 'O mně', 'O autorce', 'Kdo stojí za objektivem. Příběh, styl, přístup k fotografii.',
   'Jmenuji se Esterka a fotím od dětství. Nejsilnější vztah mám ke koním – k jejich tichu, pohybu a pohledu, který nelze hrát.'),
  ('sluzby', 'Služby', 'Fotografické služby', 'Focení koní a jezdců, portrétní focení, reportáže ze závodů i přírody.',
   'Každé focení je domluvené osobně. Nehrajeme si na lesk, hledáme pravdivé okamžiky.'),
  ('cenik', 'Ceník', 'Ceník', 'Přehled cen focení a balíčků. Férově a transparentně.',
   'Níže najdete základní balíčky. Ráda připravím nabídku přesně na míru – stačí se ozvat.'),
  ('kontakt', 'Kontakt', 'Kontakt', 'Napište mi. Ráda se ozvu zpět do 48 hodin.',
   'Nejrychleji mě zastihnete e-mailem nebo na Instagramu.'),
  ('ochrana-osobnich-udaju', 'Ochrana osobních údajů', 'Ochrana osobních údajů', 'Informace o zpracování osobních údajů na tomto webu.',
   'Tento dokument popisuje, jak nakládám s osobními údaji návštěvníků a klientů.')
on conflict (slug) do nothing;

-- Modulární obsah stránky Služby (stejná logika jako migrace 0004 – jen pokud nemá bloky)
do $$
declare
  v_page_id uuid;
  v_count   int;
begin
  select id into v_page_id from public.pages where slug = 'sluzby';
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
    'service_cards',
    jsonb_build_object(
      'items',
      jsonb_build_array(
        jsonb_build_object(
          'title', 'Koně a jezdci',
          'description', 'Portréty, pohyb, detail. Fotím tam, kde se cítíte doma.'
        ),
        jsonb_build_object(
          'title', 'Osobní portrét',
          'description', 'Rodinné, partnerské nebo autoportréty v přírodě.'
        ),
        jsonb_build_object(
          'title', 'Editorial a reportáže',
          'description', 'Koncepční focení pro značky, stáje a závody.'
        )
      )
    )
  ),
  (
    v_page_id,
    1,
    'process_steps',
    jsonb_build_object(
      'heading', 'Jak probíhá focení',
      'steps',
      jsonb_build_array(
        jsonb_build_object('label', '01', 'title', 'Domluva', 'description', 'Napíšete, zjistíme si, co si přejete.'),
        jsonb_build_object('label', '02', 'title', 'Plán', 'description', 'Vybereme místo, čas a náladu.'),
        jsonb_build_object('label', '03', 'title', 'Focení', 'description', 'V klidu, bez tlaku.'),
        jsonb_build_object('label', '04', 'title', 'Dodání', 'description', 'Online galerie a výběr nejlepších.')
      )
    )
  ),
  (
    v_page_id,
    2,
    'cta',
    jsonb_build_object(
      'title', 'Pojďme se domluvit',
      'description', 'Odepíšu obvykle do 48 hodin. Napíšete mi, co byste rádi, já pošlu návrh.',
      'primary', jsonb_build_object('label', 'Napsat', 'href', '/kontakt'),
      'secondary', jsonb_build_object('label', 'Ceník', 'href', '/cenik')
    )
  );
end $$;

-- Tagy
insert into public.tags (name, slug) values
  ('Kůň', 'kun'),
  ('Portrét', 'portret'),
  ('Zvířata', 'zvirata'),
  ('Ptáci', 'ptaci'),
  ('Příroda', 'priroda'),
  ('Jezdec', 'jezdec'),
  ('Závody', 'zavody')
on conflict (slug) do nothing;

-- Ceník – ukázka
insert into public.pricing_items (section, title, description, price_label, features, sort_order) values
  ('balicky', 'Krátké focení', 'Ideální pro sólo portrét nebo portrét s jedním koněm. Cca 60 minut.', 'od 3 500 Kč',
   '["60 minut focení","15 upravených fotografií","online galerie"]'::jsonb, 1),
  ('balicky', 'Střední focení', 'Výlet na vaše oblíbené místo, dostatek prostoru i pro pohybové snímky.', 'od 5 900 Kč',
   '["90–120 minut focení","30 upravených fotografií","online galerie","tištěné fotografie A4 x 3"]'::jsonb, 2),
  ('balicky', 'Editorial / příběh', 'Koncepční focení pro majitele, trenéry, stáje a značky.', 'na míru',
   '["půldenní focení","kreativní koncept","editorial sada", "kompletní licence pro web"]'::jsonb, 3),
  ('doplnky', 'Další upravená fotografie', null, '200 Kč',
   '["ručně retušovaná","dodáno do 7 dnů"]'::jsonb, 10),
  ('doplnky', 'Tisk ve fotolabu', 'Prémiový tisk na matný papír.', 'od 120 Kč',
   '["formáty 10×15 až A2"]'::jsonb, 11)
on conflict do nothing;
