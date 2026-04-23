import type { Metadata } from "next";
import { SITE_DEFAULTS } from "@/lib/constants";
import { publicEnv } from "@/lib/env";

/** Název značky z nastavení webu; fallback na výchozí název z konstant. */
export function resolveSiteBrand(siteName?: string | null): string {
  return siteName?.trim() || SITE_DEFAULTS.name;
}

/** Odstraní zastaralý seed placeholder značky z titulků (včetně skládání „| značka“). */
export function stripLegacyBrandFromTitle(input: string): string {
  let s = input.trim();
  if (!s) return "";
  s = s.replace(/\s*[–—\-|]\s*Esterky\s+Fotky\b/gi, "").trim();
  s = s.replace(/^Esterky\s+Fotky\b\s*[–—\-|]?\s*/i, "").trim();
  s = s.replace(/\bEsterky\s+Fotky\b/gi, "").trim();
  s = s.replace(/\s{2,}/g, " ").trim();
  s = s.replace(/\s*[–—\-|]\s*$/g, "").trim();
  return s;
}

/** Totéž pro meta popisy a sdílené texty (bez rozbití vět typu „na tomto webu“). */
export function stripLegacyBrandFromFreeText(input: string): string {
  let s = input.trim();
  if (!s) return "";
  s = s.replace(/\bna webu\s+Esterky\s+Fotky\b/gi, "na tomto webu");
  s = s.replace(/\s*[–—\-|]\s*Esterky\s+Fotky\b/gi, "");
  s = s.replace(/\bEsterky\s+Fotky\b/gi, "");
  s = s.replace(/\s{2,}/g, " ").trim();
  s = s.replace(/\s+([.,;:!?])/g, "$1");
  return s.trim();
}

export interface BuildMetadataInput {
  title?: string | null;
  /** Značka pro suffix „Stránka | …“ a pro OpenGraph siteName. Výchozí = SITE_DEFAULTS.name */
  siteName?: string | null;
  /**
   * Celý titulek bez šablony z layoutu (`title.absolute` v Next.js).
   * Nutné pro chybové stránky apod., aby se nepřidal druhý „| značka“.
   */
  titleIsAbsolute?: boolean;
  /**
   * Segment pro záložku; sloučí se s `title.template` v `(site)/layout.tsx`.
   * OG/Twitter: „segment | značka“, případně viz `openGraphTitle`.
   */
  useTitleTemplate?: boolean;
  /**
   * Delší segment jen pro OG/Twitter při `useTitleTemplate` (např. SEO titul z DB).
   * Když chybí nebo se shoduje s `title`, použije se `title`.
   */
  openGraphTitle?: string | null;
  description?: string | null;
  path?: string;
  image?: string | null;
  noIndex?: boolean;
  type?: "website" | "article";
}

/** Stránka z tabulky `pages` – jednotné metadata pro veřejné CMS podstránky. */
export type CmsPageForMetadata = {
  title: string;
  seo_title: string | null;
  seo_description: string | null;
};

/**
 * Záložka = krátký `page.title` (jako v menu), OG může použít delší `seo_title`, pokud se liší.
 */
export function metadataForCmsPage(args: {
  page: CmsPageForMetadata | null | undefined;
  path: string;
  fallbackTitle: string;
  siteName?: string | null;
}): Metadata {
  const tab = (args.page?.title?.trim() || args.fallbackTitle).trim();
  const seo = args.page?.seo_title?.trim();
  const useSeoForOg = Boolean(seo && seo.toLowerCase() !== tab.toLowerCase());
  return buildMetadata({
    title: tab,
    openGraphTitle: useSeoForOg ? seo : undefined,
    description: args.page?.seo_description,
    path: args.path,
    useTitleTemplate: true,
    siteName: args.siteName,
  });
}

export function buildMetadata(input: BuildMetadataInput = {}): Metadata {
  const brand = resolveSiteBrand(input.siteName);
  const titleCleaned = stripLegacyBrandFromTitle(input.title?.trim() ?? "");
  const rawTitle = titleCleaned || undefined;
  const ogSegmentCleaned = input.openGraphTitle?.trim()
    ? stripLegacyBrandFromTitle(input.openGraphTitle.trim())
    : "";
  const segmentForOg = (ogSegmentCleaned || titleCleaned).trim() || undefined;

  const ogTitle = (() => {
    if (!rawTitle) return brand;
    if (input.titleIsAbsolute) return rawTitle;
    if (input.useTitleTemplate && segmentForOg) return `${segmentForOg} | ${brand}`;
    if (rawTitle) return `${rawTitle} | ${brand}`;
    return brand;
  })();

  const documentTitle: Metadata["title"] = (() => {
    if (!rawTitle) return brand;
    if (input.titleIsAbsolute) return { absolute: rawTitle };
    if (input.useTitleTemplate) return rawTitle;
    return `${rawTitle} | ${brand}`;
  })();
  const descriptionRaw = input.description?.trim() || SITE_DEFAULTS.description;
  const description =
    stripLegacyBrandFromFreeText(descriptionRaw) || SITE_DEFAULTS.description;
  const path = input.path ?? "/";
  const url = absoluteUrl(path);
  const image = input.image || absoluteUrl(SITE_DEFAULTS.ogImage);

  return {
    metadataBase: new URL(publicEnv.siteUrl),
    title: documentTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: input.type ?? "website",
      locale: SITE_DEFAULTS.locale,
      url,
      title: ogTitle,
      description,
      siteName: brand,
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: image ? [image] : undefined,
    },
    robots: input.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
  };
}

export function absoluteUrl(path: string): string {
  const base = publicEnv.siteUrl.replace(/\/$/, "");
  if (!path.startsWith("/")) return `${base}/${path}`;
  return `${base}${path}`;
}

export function jsonLd(data: Record<string, unknown>) {
  return { __html: JSON.stringify({ "@context": "https://schema.org", ...data }) };
}
