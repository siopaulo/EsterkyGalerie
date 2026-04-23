-- Odstranění zastaralého seed názvu značky z uložených SEO dat a výchozích hodnot DB.

alter table public.site_settings
  alter column site_name set default 'Foto web';

alter table public.site_settings
  alter column default_seo_title set default 'Fotografie s duší koně';

-- Stránky: SEO titulky ze seedu (POSIX třídy místo \s kvůli kompatibilitě)
update public.pages
set seo_title = trim(
  regexp_replace(
    regexp_replace(
      seo_title,
      '[[:space:]]*[–—\-|][[:space:]]*Esterky[[:space:]]+Fotky[[:space:]]*',
      '',
      'gi'
    ),
    '^Esterky[[:space:]]+Fotky[[:space:]]*[–—\-|][[:space:]]*',
    '',
    'i'
  )
)
where seo_title ~* 'esterky';

update public.pages
set seo_title = title
where seo_title is not null
  and trim(seo_title) = ''
  and title is not null;

update public.pages
set seo_title = title
where seo_title ~* '^esterky[[:space:]]+fotky$'
  and title is not null;

-- Popisy stránek
update public.pages
set seo_description = replace(seo_description, 'na webu Esterky Fotky', 'na tomto webu')
where seo_description ilike '%na webu Esterky Fotky%';

update public.pages
set seo_description = regexp_replace(seo_description, 'Esterky[[:space:]]+Fotky', '', 'gi')
where seo_description ilike '%esterky%fotky%';

update public.pages
set seo_description = trim(regexp_replace(seo_description, '[[:space:]]{2,}', ' ', 'g'))
where seo_description is not null;

-- Nastavení webu (typicky řádek id = 1 ze seedu)
update public.site_settings
set site_name = 'Foto web'
where trim(site_name) ilike 'esterky fotky';

update public.site_settings
set default_seo_title = trim(
  regexp_replace(
    regexp_replace(
      coalesce(default_seo_title, ''),
      '[[:space:]]*[–—\-|][[:space:]]*Esterky[[:space:]]+Fotky[[:space:]]*',
      '',
      'gi'
    ),
    '^Esterky[[:space:]]+Fotky[[:space:]]*[–—\-|][[:space:]]*',
    '',
    'i'
  )
)
where default_seo_title ~* 'esterky';

update public.site_settings
set default_seo_title = 'Fotografie s duší koně'
where default_seo_title is not null
  and trim(default_seo_title) = '';

update public.site_settings
set default_seo_description = replace(default_seo_description, 'Esterky Fotky', 'tento web')
where default_seo_description ilike '%esterky%fotky%';

-- Příběhy (SEO titulky)
update public.stories
set seo_title = trim(
  regexp_replace(
    regexp_replace(
      coalesce(seo_title, ''),
      '[[:space:]]*[–—\-|][[:space:]]*Esterky[[:space:]]+Fotky[[:space:]]*',
      '',
      'gi'
    ),
    '^Esterky[[:space:]]+Fotky[[:space:]]*[–—\-|][[:space:]]*',
    '',
    'i'
  )
)
where seo_title ~* 'esterky';

update public.stories
set seo_title = title
where seo_title is not null
  and trim(seo_title) = ''
  and title is not null;
