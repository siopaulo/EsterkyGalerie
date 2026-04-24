import { z } from "zod";

/**
 * Schémata obsahových bloků.
 * Payloady jsou uložené v DB jako jsonb a parsujeme je defenzivně.
 * Reference na fotky držíme jako UUID; pokud fotka neexistuje (smazaná),
 * renderer vrátí fallback – bez pádu UI.
 */

export const photoRef = z.object({
  photo_id: z.string().uuid(),
});

export const heroSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional().default(""),
  cta_primary: z
    .object({ label: z.string().min(1), href: z.string().min(1) })
    .optional(),
  cta_secondary: z
    .object({ label: z.string().min(1), href: z.string().min(1) })
    .optional(),
  background_photo_id: z.string().uuid().optional().nullable(),
  align: z.enum(["left", "center"]).default("left"),
});
export type HeroPayload = z.infer<typeof heroSchema>;

export const richTextSchema = z.object({
  html: z.string().max(50_000),
});
export type RichTextPayload = z.infer<typeof richTextSchema>;

export const sectionHeadingSchema = z.object({
  eyebrow: z.string().max(80).optional().default(""),
  title: z.string().min(1).max(200),
  description: z.string().max(400).optional().default(""),
  align: z.enum(["left", "center"]).default("left"),
});
export type SectionHeadingPayload = z.infer<typeof sectionHeadingSchema>;

export const singleImageSchema = z.object({
  photo_id: z.string().uuid(),
  caption: z.string().max(200).optional().default(""),
  aspect: z.enum(["auto", "portrait", "landscape", "square"]).default("auto"),
});
export type SingleImagePayload = z.infer<typeof singleImageSchema>;

export const imagePairSchema = z.object({
  left_photo_id: z.string().uuid(),
  right_photo_id: z.string().uuid(),
  caption: z.string().max(200).optional().default(""),
});
export type ImagePairPayload = z.infer<typeof imagePairSchema>;

export const imageCarouselSchema = z.object({
  photo_ids: z.array(z.string().uuid()).min(1).max(24),
  caption: z.string().max(200).optional().default(""),
});
export type ImageCarouselPayload = z.infer<typeof imageCarouselSchema>;

export const photoGridSchema = z.object({
  photo_ids: z.array(z.string().uuid()).min(1).max(24),
  columns: z.number().int().min(2).max(4).default(3),
});
export type PhotoGridPayload = z.infer<typeof photoGridSchema>;

export const quoteSchema = z.object({
  quote: z.string().min(1).max(600),
  author: z.string().max(120).optional().default(""),
  context: z.string().max(200).optional().default(""),
});
export type QuotePayload = z.infer<typeof quoteSchema>;

export const ctaSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(400).optional().default(""),
  primary: z.object({ label: z.string().min(1), href: z.string().min(1) }),
  secondary: z
    .object({ label: z.string().min(1), href: z.string().min(1) })
    .optional(),
});
export type CtaPayload = z.infer<typeof ctaSchema>;

export const faqSchema = z.object({
  items: z
    .array(
      z.object({
        question: z.string().min(1).max(300),
        answer: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(30),
});
export type FaqPayload = z.infer<typeof faqSchema>;

/** Mřížka karet (např. přehled služeb) – titulek + krátký text, bez fotek. */
export const serviceCardsSchema = z.object({
  items: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        description: z.string().max(600).optional().default(""),
      }),
    )
    .min(1)
    .max(6),
});
export type ServiceCardsPayload = z.infer<typeof serviceCardsSchema>;

/** Číslované kroky procesu (např. „Jak probíhá focení“). Prázdné `label` ⇒ 01, 02, … */
export const processStepsSchema = z.object({
  heading: z.string().min(1).max(200),
  steps: z
    .array(
      z.object({
        label: z.string().max(20).optional().default(""),
        title: z.string().min(1).max(120),
        description: z.string().max(600).optional().default(""),
      }),
    )
    .min(2)
    .max(8),
});
export type ProcessStepsPayload = z.infer<typeof processStepsSchema>;

export const featuredPhotosSchema = z.object({
  photo_ids: z.array(z.string().uuid()).min(1).max(12),
  title: z.string().max(200).optional().default(""),
  description: z.string().max(400).optional().default(""),
  view_all_href: z.string().optional().default("/galerie"),
});
export type FeaturedPhotosPayload = z.infer<typeof featuredPhotosSchema>;

export const storyIntroSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional().default(""),
  date: z.string().optional(),
  cover_photo_id: z.string().uuid().optional().nullable(),
});
export type StoryIntroPayload = z.infer<typeof storyIntroSchema>;

// ---------- Home-specific bloky ----------
// Všechny prefix `home_*`, aby byly v admin editoru čitelně odděleny
// a nešly omylem použít na jiné stránce (CMS ale zakazuje pouze doporučením).

const ctaButtonSchema = z
  .object({
    label: z.string().min(1).max(80),
    href: z.string().min(1).max(200),
  })
  .optional();

/**
 * Hero pro homepage: text vlevo, rotující photo-carousel vpravo.
 * `photo_ids` prázdné ⇒ fallback na site_settings.featured_photo_ids.
 */
export const homeHeroSchema = z.object({
  eyebrow: z.string().max(80).optional().default(""),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(400).optional().default(""),
  cta_primary: ctaButtonSchema,
  cta_secondary: ctaButtonSchema,
  photo_ids: z.array(z.string().uuid()).max(24).optional().default([]),
  auto_rotate_ms: z.number().int().min(0).max(60_000).optional().default(5000),
});
export type HomeHeroPayload = z.infer<typeof homeHeroSchema>;

/**
 * Editorial 2-sloupcový textový blok – levý nadpis, pravé odstavce + odkaz.
 */
export const homeAboutSchema = z.object({
  eyebrow: z.string().max(80).optional().default(""),
  title: z.string().min(1).max(200),
  paragraphs: z.array(z.string().min(1).max(2000)).min(1).max(6),
  link_label: z.string().max(120).optional().default(""),
  link_href: z.string().max(200).optional().default(""),
});
export type HomeAboutPayload = z.infer<typeof homeAboutSchema>;

/**
 * Plně editorial rotující galerie s čistším layoutem – žádné přestřelené překryvy.
 * `use_featured=true` ⇒ bere site_settings.featured_photo_ids,
 * jinak použije explicitně vybrané `photo_ids`.
 */
export const homeGalleryCarouselSchema = z.object({
  eyebrow: z.string().max(80).optional().default(""),
  title: z.string().max(200).optional().default(""),
  view_all_label: z.string().max(80).optional().default(""),
  view_all_href: z.string().max(200).optional().default("/galerie"),
  use_featured: z.boolean().optional().default(true),
  photo_ids: z.array(z.string().uuid()).max(24).optional().default([]),
  auto_rotate_ms: z.number().int().min(0).max(60_000).optional().default(5000),
  layout: z.enum(["editorial", "fade", "strip"]).optional().default("editorial"),
});
export type HomeGalleryCarouselPayload = z.infer<typeof homeGalleryCarouselSchema>;

/**
 * Centrovaný service CTA banner (rozdíl oproti `cta`: má eyebrow + 2 volitelná tlačítka).
 */
export const homeServiceCtaSchema = z.object({
  eyebrow: z.string().max(80).optional().default(""),
  title: z.string().min(1).max(200),
  description: z.string().max(400).optional().default(""),
  cta_primary: ctaButtonSchema,
  cta_secondary: ctaButtonSchema,
  background: z.enum(["muted", "plain"]).optional().default("muted"),
});
export type HomeServiceCtaPayload = z.infer<typeof homeServiceCtaSchema>;

/**
 * Feed nejnovějších příběhů. Samotné příběhy si bere renderer z DB
 * (stories tabulka), `count` definuje kolik jich zobrazit.
 */
export const homeStoriesFeedSchema = z.object({
  eyebrow: z.string().max(80).optional().default(""),
  title: z.string().max(200).optional().default(""),
  view_all_label: z.string().max(80).optional().default("Všechny příběhy"),
  view_all_href: z.string().max(200).optional().default("/pribehy"),
  count: z.number().int().min(1).max(12).optional().default(3),
});
export type HomeStoriesFeedPayload = z.infer<typeof homeStoriesFeedSchema>;

export const BLOCK_SCHEMAS = {
  hero: heroSchema,
  rich_text: richTextSchema,
  section_heading: sectionHeadingSchema,
  single_image: singleImageSchema,
  image_pair: imagePairSchema,
  image_carousel: imageCarouselSchema,
  photo_grid: photoGridSchema,
  quote: quoteSchema,
  cta: ctaSchema,
  faq: faqSchema,
  service_cards: serviceCardsSchema,
  process_steps: processStepsSchema,
  featured_photos: featuredPhotosSchema,
  story_intro: storyIntroSchema,
  home_hero: homeHeroSchema,
  home_about: homeAboutSchema,
  home_gallery_carousel: homeGalleryCarouselSchema,
  home_service_cta: homeServiceCtaSchema,
  home_stories_feed: homeStoriesFeedSchema,
} as const;

export type BlockType = keyof typeof BLOCK_SCHEMAS;

export const BLOCK_TYPES = Object.keys(BLOCK_SCHEMAS) as BlockType[];

export const BLOCK_LABELS: Record<BlockType, string> = {
  hero: "Úvodní banner",
  rich_text: "Text",
  section_heading: "Nadpis sekce",
  single_image: "Jedna fotografie",
  image_pair: "Dvojice fotek",
  image_carousel: "Galerie s posunem",
  photo_grid: "Mřížka fotek",
  quote: "Citace",
  cta: "Sekce s tlačítkem (výzva k akci)",
  faq: "Časté otázky (FAQ)",
  service_cards: "Karty služeb (mřížka)",
  process_steps: "Kroky procesu (číslované)",
  featured_photos: "Vybrané fotky",
  story_intro: "Úvod příběhu",
  home_hero: "Hlavní stránka – úvodní sekce s carouselem",
  home_about: "Hlavní stránka – text o autorce (2 sloupce)",
  home_gallery_carousel: "Hlavní stránka – rotující galerie",
  home_service_cta: "Hlavní stránka – služby s tlačítkem",
  home_stories_feed: "Hlavní stránka – nejnovější příběhy",
};

/**
 * Bloky, které se hodí primárně na homepage. Admin editor pro _home
 * stránku tuto sadu používá jako doporučenou volbu v pickeru.
 */
export const HOME_BLOCK_TYPES: BlockType[] = [
  "home_hero",
  "home_about",
  "home_gallery_carousel",
  "home_service_cta",
  "home_stories_feed",
  "rich_text",
  "quote",
  "faq",
  "cta",
];

/**
 * Home-specific bloky nemají smysl mimo hlavní stránku – neobsahují
 * fallback na kontextová data a renderují se s prázdnotou.
 * Editor pro ostatní stránky a pro příběhy je z nabídky filtruje.
 */
export const NON_HOME_BLOCK_TYPES: BlockType[] = BLOCK_TYPES.filter(
  (t) => !t.startsWith("home_"),
);

export function isBlockType(v: unknown): v is BlockType {
  return typeof v === "string" && v in BLOCK_SCHEMAS;
}

export function parseBlockPayload(blockType: string, payload: unknown):
  | { ok: true; type: BlockType; data: unknown }
  | { ok: false; type: string; error: string } {
  if (!isBlockType(blockType)) {
    return { ok: false, type: blockType, error: `Neznámý typ bloku: ${blockType}` };
  }
  const result = BLOCK_SCHEMAS[blockType].safeParse(payload);
  if (!result.success) {
    return { ok: false, type: blockType, error: result.error.message };
  }
  return { ok: true, type: blockType, data: result.data };
}
