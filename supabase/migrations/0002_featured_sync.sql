-- Synchronizace is_featured_home a site_settings.featured_photo_ids.
-- Dříve šlo o dva nezávislé zdroje pravdy. Od této migrace je udržujeme 1:1
-- v aplikační vrstvě, tady jen jednorázově sjednotíme historické data.

-- 1) Fotky, které mají is_featured_home = true a nejsou v settings listu – doplnit.
-- 2) Fotky, které mají is_featured_home = false a jsou v listu – odebrat z listu.
-- 3) Fotky, které jsou v listu, nastavit is_featured_home = true.

-- Přidej do seznamu všechny fotky, které mají flag a chybí.
update site_settings
set featured_photo_ids = coalesce(featured_photo_ids, '{}'::uuid[]) ||
  coalesce((
    select array_agg(p.id)
    from photos p
    where p.is_featured_home = true
      and p.deleted_at is null
      and not (p.id = any(coalesce(site_settings.featured_photo_ids, '{}'::uuid[])))
  ), '{}'::uuid[])
where id = 1;

-- Očisti seznam o fotky, které neexistují / jsou smazané.
update site_settings
set featured_photo_ids = coalesce((
  select array_agg(id)
  from unnest(featured_photo_ids) as id
  where exists (
    select 1 from photos p
    where p.id = id and p.deleted_at is null
  )
), '{}'::uuid[])
where id = 1;

-- Dorovnej flag podle listu (list je zdroj pořadí).
update photos
set is_featured_home = true
where id in (
  select unnest(featured_photo_ids) from site_settings where id = 1
);

-- Fotky mimo list už nejsou featured.
update photos
set is_featured_home = false
where is_featured_home = true
  and id not in (
    select unnest(featured_photo_ids) from site_settings where id = 1
  );
