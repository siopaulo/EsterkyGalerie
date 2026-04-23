import type { Metadata } from "next";
import { SITE_DEFAULTS } from "@/lib/constants";
import { publicEnv } from "@/lib/env";

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
  const brand = input.siteName?.trim() || SITE_DEFAULTS.name;
  const rawTitle = input.title?.trim();
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
  const description = input.description?.trim() || SITE_DEFAULTS.description;
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
