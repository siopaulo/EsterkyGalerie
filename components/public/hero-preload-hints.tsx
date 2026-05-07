import {
  buildHeroSrcSet,
  HERO_SIZES_DEFAULT,
  HERO_WIDTHS,
  CLOUDINARY_CONFIGURED,
  cldUrl,
} from "@/lib/cloudinary-url";
import type { Photo } from "@/types/database";

interface HeroPreloadHintsProps {
  photo: Photo;
  /** Volitelný override `imageSizes` – defaultně velký full-bleed hero. */
  sizes?: string;
  /** Které widths použít pro preload srcset. Default = HERO_WIDTHS. */
  widths?: number[];
}

/**
 * Server component – vykreslí `<link rel="preload" as="image">` pro hlavní LCP
 * obrázek na homepage. Next.js App Router hoistuje `<link>` z RSC do `<head>`.
 *
 * Cíl: prohlížeč objeví Cloudinary hero URL ještě před hydratací JS carouselu
 * a pustí jeho stažení s prioritou. To je nejvýznamnější páka na LCP, protože
 * eliminuje řetězec _HTML → JS bundle → React render → image discovery_ a mění
 * ho na _HTML → preload → image_.
 */
export function HeroPreloadHints({
  photo,
  sizes = HERO_SIZES_DEFAULT,
  widths = HERO_WIDTHS,
}: HeroPreloadHintsProps) {
  if (!photo.cloudinary_public_id || !CLOUDINARY_CONFIGURED) return null;

  const srcSet = buildHeroSrcSet(photo.cloudinary_public_id, widths);
  if (!srcSet) return null;

  // Fallback href (browser ho nepotřebuje, když má imagesrcset, ale
  // některé crawler/agenty se chovají bezpečněji s href).
  const fallbackWidth = widths[Math.floor(widths.length / 2)] ?? widths[0] ?? 1280;
  const fallbackHref = cldUrl(photo.cloudinary_public_id, {
    width: fallbackWidth,
    crop: "fill",
    gravity: "auto",
    quality: "auto:good",
  });

  return (
    <link
      rel="preload"
      as="image"
      href={fallbackHref}
      imageSrcSet={srcSet}
      imageSizes={sizes}
      fetchPriority="high"
    />
  );
}
