# Esterky Fotky

Produkční web pro české foto portfolio s důrazem na elegantní editorial fotografii, správu příběhů a centrální galerii. Veřejná část v češtině, privátní admin na `/studio`.

## Stack

- **Next.js 16 (App Router)** + **TypeScript**
- **Tailwind CSS v4** (CSS-native config v `app/globals.css`)
- **shadcn/ui** stylem postavené primitivy (`components/ui/*`)
- **React Hook Form + Zod** pro formuláře a validace
- **Supabase** – Postgres, Auth (jediný admin účet), RLS
- **Cloudinary** – storage, signed uploady, responzivní delivery
- **Resend** – transakční e-mail z kontaktního formuláře
- **Cloudflare Turnstile** – anti-spam
- **Cloudflare Email Routing** – veřejný alias `kontakt@domena.cz`
- **Cloudflare Web Analytics** – privacy-first analytics
- **Sentry** (volitelné) – chyby v prohlížeči i na serveru
- **Netlify** – deployment
- **pnpm**

## Struktura projektu

```
app/
  (site)/               # veřejné stránky
  studio/               # neveřejný admin (chráněný middleware + auth)
  api/                  # route handlery (contact, cloudinary sign, export)
components/
  ui/                   # primitivy
  public/               # veřejné komponenty (header, footer, lightbox, ...)
  admin/                # admin UI
  shared/               # sdílené komponenty (CloudinaryImage)
features/
  blocks/               # modulární content engine (schemas, render, sanitize)
  photos/ stories/ pages/ tags/ pricing/ contact/ site-settings/
lib/                    # helpers (supabase, cloudinary, resend, turnstile, seo, auth, rate-limit)
types/                  # typy databáze
supabase/
  migrations/           # SQL schéma
  seed.sql              # počáteční data
public/                 # statické assety (favicon, placeholder.svg, og-default.jpg)
```

## Rychlý start

```bash
pnpm install
cp .env.example .env.local
# vyplň hodnoty
pnpm dev
```

Web poběží na `http://localhost:3000`, studio na `http://localhost:3000/studio`.

## Sentry (volitelné)

1. Založ účet na [sentry.io](https://sentry.io), vytvoř projekt typu **Next.js**.
2. Z **Settings → Client Keys (DSN)** zkopíruj DSN do `.env.local` jako `NEXT_PUBLIC_SENTRY_DSN` (a případně `SENTRY_DSN`, pokud chceš oddělit server – často stačí jen veřejná proměnná).
3. Nastav `SENTRY_ENVIRONMENT` (např. `production`) kvůli filtrování v dashboardu.
4. Volitelně: **Auth Token** + `SENTRY_ORG` + `SENTRY_PROJECT` v CI / Netlify pro čitelné stack trace (source maps). Bez tokenu build funguje, jen budou méně čitelné názvy souborů v Sentry.
5. Po deployi ověř v Sentry záložku **Issues** (např. dočasně vyhoď testovací chybu z UI mimo devtools konzoli).

Proměnné jsou popsány v `.env.example`. CSP v produkci už povoluje odesílání na Sentry ingest domény.

## Nastavení Supabase

1. Vytvoř projekt v Supabase a zkopíruj `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
2. Aplikuj migraci a seed:

   ```bash
   # Supabase CLI
   supabase link --project-ref <ref>
   supabase db push
   psql "$SUPABASE_DB_URL" -f supabase/seed.sql
   # nebo: v Supabase SQL editoru nahraj supabase/migrations/0001_init.sql a poté seed.sql
   ```

3. Vytvoř admin uživatele v Dashboardu → Auth → Users → „Add user“.
4. (Volitelné) `pnpm db:types` pro generované DB typy.

RLS politiky v migraci už pokrývají public read + authenticated write; kontaktní formulář smí anonymně `INSERT` pouze do `contact_messages`.

## Cloudinary

1. V Cloudinary konzoli získej cloud name + API key/secret.
2. Vyplň `CLOUDINARY_*` a `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
3. Admin upload používá **signed upload** endpoint `/api/upload/sign`, kde se podpis generuje server-side s API secretem (nikdy se neposílá do klienta).
4. Citlivé EXIF/GPS metadata se při uploadu nastaví na `image_metadata: false` a `exif: false` v signed payloadu.

## Resend + Cloudflare Email Routing

**Resend (odchozí e-mail z formuláře):**

1. V Resend ověř doménu `domena.cz` a přidej požadované DNS záznamy.
2. `RESEND_FROM="Esterky Fotky <kontakt@domena.cz>"` musí být na ověřené doméně.
3. `CONTACT_DELIVERY_EMAIL` je osobní schránka majitelky.

**Cloudflare Email Routing (příchozí e-mail, veřejná adresa):**

1. V Cloudflare dashboardu: **Email → Email Routing → Enable**.
2. CF automaticky přidá `MX` + `TXT` záznamy pro doménu.
3. Vytvoř pravidlo `kontakt@domena.cz → osobni@email.cz`.
4. Tím budete mít plně funkční veřejnou adresu i přesto, že schránka technicky nikde neexistuje.

> Pozor na DMARC/SPF: Pokud používáte CF Email Routing pro příjem a Resend pro odesílání, DMARC doména musí povolit Resend. Resend vyžaduje `TXT` záznamy, které projdou DMARC; postupujte podle průvodce v Resend dashboardu.

## Turnstile

1. V Cloudflare dashboardu vytvoř Turnstile site a přidej doménu.
2. Doplň **oba** klíče: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (klient) a `TURNSTILE_SECRET_KEY` (server).
3. Sdílená klientská komponenta `components/public/turnstile-widget.tsx` vykresluje widget v `ContactForm` i `ReviewForm`. Server ověřuje token v `/api/contact` a `/api/reviews` přes `lib/turnstile.ts` (volá Cloudflare Siteverify).
4. **V produkci je `TURNSTILE_SECRET_KEY` povinný** – pokud chybí, formuláře selžou (`not-configured`). Žádný tichý bypass, aby produkce neběžela bez ochrany.
5. V devu bez klíčů se ověření přeskočí (pro rychlé iterace). Chceš-li Turnstile otestovat lokálně, použij oficiální „always-pass" test keys Cloudflare (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`).

## Reference / recenze

- Veřejná stránka `/reference` ukazuje schválené recenze, agregát hvězdiček a distribuci.
- Veřejný formulář `ReviewForm` posílá novou recenzi do `/api/reviews` – chráněné rate-limitem (3/hod/IP), honeypotem a Turnstile.
- Nová recenze vzniká vždy jako `approved = false`.
- Admin sekce `/studio/recenze` umí filtrovat (ke schválení / schváleno / podle hvězdiček), řadit, editovat, mazat a schvalovat/skrývat.
- Data v `public.reviews` (migrace `supabase/migrations/0004_reviews.sql`), RLS pouští veřejné čtení jen pro `approved = true`.

## Cloudflare Web Analytics

Volitelné. Nastavte `NEXT_PUBLIC_CF_ANALYTICS_TOKEN`, beacon se přidá do root layoutu jen pokud je token přítomný.

## Admin (studio)

- URL: `/studio` (v navigaci se neukazuje, robots `noindex`).
- Přístup: Supabase Auth, single-admin model. Architektura je připravená na role (stačí rozšířit `requireAdmin()`).
- Rate limit na login + kontaktní formulář (`lib/rate-limit.ts`).
- Všechny server actions volají `requireAdmin()` – bezpečnost nestojí na skrytí URL.

## Modulární obsah

Block engine v `features/blocks/` definuje:

- `hero`, `rich_text`, `section_heading`, `single_image`, `image_pair`, `image_carousel`, `photo_grid`, `quote`, `cta`, `faq`, `featured_photos`, `story_intro`
- Každý má Zod schema (`schemas.ts`), admin editor (`components/admin/block-editor.tsx`) a public renderer (`render.tsx`).
- Nevalidní payloady se **tiše** nahradí fallbackem a zaloguje se warning – web se nikdy nerozbije.

## Bezpečné mazání

- Fotky mají `soft-delete` (`deleted_at`), public renderer pro chybějící/smazanou fotku ukáže placeholder.
- V adminu je warning `AlertTriangle` u bloků s nenalezenou fotkou.
- Smazání příběhu se ptá, zda smazat i fotky, které **nejsou použité jinde** (usage tracking přes `asset_references`).

## Export a backup

- CSV export zpráv: `/api/contacts/export` (pouze admin).
- Export metadat galerie/příběhů: Supabase `pg_dump` nebo SQL editor. Cloudinary assety zálohujte přes Cloudinary admin API (`cloudinary` balíček v `lib/cloudinary.ts` nabízí `getResource`).

## Deployment na Netlify

1. Připoj repozitář.
2. Nastav build command `pnpm build`, publish dir `.next` (plugin `@netlify/plugin-nextjs` doplní runtime).
3. Do Netlify env proměnných přidej všechny položky z `.env.example`.
4. Po prvním deployi nastav doménu (Cloudflare) → Netlify.
5. Pokud používáš vlastní doménu, aktualizuj `NEXT_PUBLIC_SITE_URL` na finální URL.

## Skripty

```
pnpm dev          # lokální server
pnpm build        # produkční build
pnpm start        # produkční server
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm format       # Prettier
pnpm db:types     # generovat DB typy
```

## Privacy a GDPR

- Privacy stránka: `/ochrana-osobnich-udaju`.
- Kontakt vyžaduje explicitní souhlas (checkbox) + ukládá `ip_hash`, ne plné IP.
- Žádné marketingové trackery, pouze Cloudflare Web Analytics (volitelné).
- Architektura připravená na cookie banner – analytics je jediný „non-essential“ beacon a dá se snadno zabalit do consent gate.

## Licence

Uzavřený projekt pro interní použití. Práva k fotografiím náleží autorce.
