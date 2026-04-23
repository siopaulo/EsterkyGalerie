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
  /** Když je true a `title` je neprázdný, titulek dokumentu je přesně `title` (bez „| značka“). */
  titleIsAbsolute?: boolean;
  /**
   * Když je true a `title` je neprázdný, vrátí se jen segment titulku (např. „Kontakt“) pro sloučení
   * s `title.template` z nadřazeného layoutu. OG/Twitter použijí plný „title | značka“.
   */
  useTitleTemplate?: boolean;
  description?: string | null;
  path?: string;
  image?: string | null;
  noIndex?: boolean;
  type?: "website" | "article";
}

export function buildMetadata(input: BuildMetadataInput = {}): Metadata {
  const brand = resolveSiteBrand(input.siteName);
  const titleCleaned = stripLegacyBrandFromTitle(input.title?.trim() ?? "");
  const rawTitle = titleCleaned || undefined;
  const ogTitle =
    rawTitle && !input.titleIsAbsolute ? `${rawTitle} | ${brand}` : rawTitle ? rawTitle : brand;

  const documentTitle: Metadata["title"] =
    rawTitle && input.useTitleTemplate
      ? rawTitle
      : rawTitle && input.titleIsAbsolute
        ? rawTitle
        : rawTitle
          ? `${rawTitle} | ${brand}`
          : brand;
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
