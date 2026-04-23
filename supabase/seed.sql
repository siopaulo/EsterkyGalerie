-- =============================================================
-- Seed – český placeholder obsah
-- =============================================================

insert into public.site_settings (id, site_name, site_tagline, default_seo_title, default_seo_description,
  contact_email_public, contact_email_delivery_target, phone, instagram_url, facebook_url, hero_texts)
values (
  1,
  'Esterky Fotky',
  'Fotografie s duší koně',
  'Esterky Fotky – fotografie s duší koně',
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
  ('o-mne', 'O mně', 'O autorce – Esterky Fotky', 'Kdo stojí za objektivem. Příběh, styl, přístup k fotografii.',
   'Jmenuji se Esterka a fotím od dětství. Nejsilnější vztah mám ke koním – k jejich tichu, pohybu a pohledu, který nelze hrát.'),
  ('sluzby', 'Služby', 'Fotografické služby – Esterky Fotky', 'Focení koní a jezdců, portrétní focení, reportáže ze závodů i přírody.',
   'Každé focení je domluvené osobně. Nehrajeme si na lesk, hledáme pravdivé okamžiky.'),
  ('cenik', 'Ceník', 'Ceník – Esterky Fotky', 'Přehled cen focení a balíčků. Férově a transparentně.',
   'Níže najdete základní balíčky. Ráda připravím nabídku přesně na míru – stačí se ozvat.'),
  ('kontakt', 'Kontakt', 'Kontakt – Esterky Fotky', 'Napište mi. Ráda se ozvu zpět do 48 hodin.',
   'Nejrychleji mě zastihnete e-mailem nebo na Instagramu.'),
  ('ochrana-osobnich-udaju', 'Ochrana osobních údajů', 'Ochrana osobních údajů', 'Informace o zpracování osobních údajů na webu Esterky Fotky.',
   'Tento dokument popisuje, jak nakládám s osobními údaji návštěvníků a klientů.')
on conflict (slug) do nothing;

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
