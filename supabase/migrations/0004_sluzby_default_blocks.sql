-- Výchozí modulární bloky pro stránku Služby (jen pokud zatím nemá žádný blok).
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
