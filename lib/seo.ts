import type { Metadata } from "next";
import { SITE_DEFAULTS } from "@/lib/constants";
import { publicEnv } from "@/lib/env";

export interface BuildMetadataInput {
  title?: string | null;
  description?: string | null;
  path?: string;
  image?: string | null;
  noIndex?: boolean;
  type?: "website" | "article";
}

export function buildMetadata(input: BuildMetadataInput = {}): Metadata {
  const title = input.title?.trim() || SITE_DEFAULTS.name;
  const description = input.description?.trim() || SITE_DEFAULTS.description;
  const path = input.path ?? "/";
  const url = absoluteUrl(path);
  const image = input.image || absoluteUrl(SITE_DEFAULTS.ogImage);

  return {
    metadataBase: new URL(publicEnv.siteUrl),
    title: input.title ? `${input.title} | ${SITE_DEFAULTS.name}` : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: input.type ?? "website",
      locale: SITE_DEFAULTS.locale,
      url,
      title,
      description,
      siteName: SITE_DEFAULTS.name,
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
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
