# Kontrola před deployem (audit / CR)

Cíl: aby se na Netlify (nebo jiném CI) neobjevovaly chyby, které lokálně neproběhly jen proto, že se nespustil stejný pipeline jako v produkci.

## Povinně před každým releasem

1. **`pnpm verify`** (= `typecheck` + `lint`) – rychlá kontrola před pushnutím.
2. **`pnpm typecheck`** – na Netlify je součástí `pnpm typecheck && pnpm build` v `netlify.toml`.
3. **`pnpm build`** – stejný krok jako na hostingu; odhalí problémy s Next/Sentry/Turbopack, které `tsc` samo neuvidí.
4. **`pnpm lint`** – součást `verify`; samostatně jen pokud nechceš znovu pouštět `tsc`.

## Logování (produkční čistota)

- Chyby a varování v aplikačním kódu směřuj přes **`log()`** z `lib/logger.ts` (JSON řádek = snadné filtrování v Netlify logs).
- U uživatelsky viditelných chyb v error boundary používej i **Sentry** (`app/error.tsx`, `app/global-error.tsx`).

## Po změnách databáze / Supabase

- Po **`.select(..., vnořená_tabulka(...))`** nepředpokládej tvar vnořeného objektu bez ověření: PostgREST/SDK často typuje vztah jako **pole** i při jednom záznamu.
- Buď **normalizuj** data v jedné funkci (mapování řádku → typ pro UI), nebo generuj typy přes `supabase gen types` a používej je konzistentně.
- Vyhni se slepému `as T[]` u výsledku dotazu bez mapování.

## Závislosti

- Po **`pnpm install`** zkontroluj **peer dependency warnings** (např. Sentry vs verze Next) a případně zvedni major verzi balíčku.
- Sleduj **deprecation** hlášky z `next build` (např. Sentry `withSentryConfig`).

## Env a tajemství

- Nové proměnné doplnit do **`.env.example`** a do dokumentace hostingu.
- Tokeny (Sentry, Supabase service role) necommitovat.

## Volitelně

- Jednorázově ověř kritické flow na **preview deployi** (formuláře, studio login).
