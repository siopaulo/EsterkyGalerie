/**
 * Klient-safe helpery pro Cloudinary URL.
 * Žádné secrets – pouze veřejný cloud name.
 *
 * Cíl tohoto souboru:
 *  1) Centrální zdroj transformací – ať varianty (hero / gallery / card / lightbox)
 *     nejsou rozházené po komponentách a ať jdou všude jednotně doladit.
 *  2) Drží přijatelný počet variant pro Cloudinary Free plán –
 *     jeden srcset = max ~5–6 šířek, žádné nadbytečné kroky.
 *  3) Default `q_auto:good` pro hero/gallery (LCP) – řízená priorita kvality
 *     bez agresivní komprese.
 */
import { publicEnv } from "@/lib/env";
import { log } from "@/lib/logger";

const CLOUD_NAME = publicEnv.cloudinaryCloudName;
const PLACEHOLDER = "/placeholder.svg";

if (typeof window !== "undefined" && !CLOUD_NAME) {
  log(
    "warn",
    "cloudinary: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME missing – images will not load; set in .env.local and restart dev",
  );
}

export type CldQuality =
  | "auto"
  | "auto:best"
  | "auto:good"
  | "auto:eco"
  | "auto:low";

export type CldVariant = {
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "limit" | "thumb";
  gravity?: "auto" | "face" | "faces" | "center";
  quality?: CldQuality;
  format?: "auto" | "jpg" | "webp" | "avif";
  blur?: number;
};

/**
 * Cloudinary public_id může obsahovat lomítka (folder struktura) – ty musí zůstat.
 * Ostatní potenciálně problematické znaky zakódujeme po částech.
 */
function encodePublicId(publicId: string): string {
  return publicId
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

export function cldUrl(publicId: string | null | undefined, variant: CldVariant = {}): string {
  if (!publicId) return PLACEHOLDER;
  if (!CLOUD_NAME) return PLACEHOLDER;

  const tx: string[] = [];
  tx.push(`f_${variant.format ?? "auto"}`);
  tx.push(`q_${variant.quality ?? "auto"}`);
  if (variant.width) tx.push(`w_${variant.width}`);
  if (variant.height) tx.push(`h_${variant.height}`);
  if (variant.crop) tx.push(`c_${variant.crop}`);
  if (variant.gravity) tx.push(`g_${variant.gravity}`);
  if (typeof variant.blur === "number") tx.push(`e_blur:${variant.blur}`);
  const transform = tx.join(",");

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transform}/${encodePublicId(publicId)}`;
}

/**
 * Vrací Cloudinary URL, nebo `null` když není cloud name / publicId.
 * Užitečné tam, kde chceme odlišit „nemám co zobrazit“ od „placeholderu“.
 */
export function cldUrlOrNull(publicId: string | null | undefined, variant: CldVariant = {}): string | null {
  if (!publicId || !CLOUD_NAME) return null;
  return cldUrl(publicId, variant);
}

export function cldSrcSet(publicId: string | null | undefined, widths: number[], base: CldVariant = {}) {
  if (!publicId || !CLOUD_NAME) return "";
  return widths.map((w) => `${cldUrl(publicId, { ...base, width: w })} ${w}w`).join(", ");
}

export function cldBlur(publicId: string | null | undefined): string | null {
  if (!publicId || !CLOUD_NAME) return null;
  return cldUrl(publicId, { width: 24, quality: "auto:eco", blur: 1000 });
}

// ---------- Centrální width sady ----------
//
// Drží minimální rozumnou množinu – čím více variant, tím více cache misses
// při prvním fetchi a tím větší zátěž pro Cloudinary Free plán. Cílíme proto
// na 4–6 šířek, které pokryjí běžné devices (320 → 2400) bez plýtvání.

/** Karty / thumbnaily v gridech (např. galerie, photo_grid bloky). */
export const CARD_WIDTHS: number[] = [400, 600, 800, 1100];

/** Editorial gallery / image_carousel (zabírá ~30–55 vw). */
export const GALLERY_WIDTHS: number[] = [480, 720, 1080, 1440];

/** Hero / LCP – až do 2x retina na 1440 logicky širokém viewportu. */
export const HERO_WIDTHS: number[] = [640, 960, 1280, 1600, 2000];

/** Plný full-screen lightbox detail. */
export const FULL_WIDTHS: number[] = [640, 960, 1280, 1600, 2000, 2400];

// Default `sizes` pro hero LCP – konzistentní s tím, co používá HomeHeroCarousel
// (text vlevo, foto vpravo na desktopu).
export const HERO_SIZES_DEFAULT =
  "(min-width: 1024px) 50vw, (min-width: 768px) 60vw, 100vw";

// ---------- Variantní helpery ----------

/**
 * Hero / LCP variant: vyšší kvalita (q_auto:good), c_fill + g_auto pro stabilní
 * crop a širší srcset (až 2000w pro retina).
 */
export function cldHeroSrcSet(
  publicId: string | null | undefined,
  widths: number[] = HERO_WIDTHS,
): string {
  if (!publicId || !CLOUD_NAME) return "";
  return cldSrcSet(publicId, widths, {
    crop: "fill",
    gravity: "auto",
    quality: "auto:good",
  });
}

/** Alias pro use ve preload hint komponentě – stejné transformace jako hero. */
export const buildHeroSrcSet = cldHeroSrcSet;

export const CLOUDINARY_CONFIGURED = Boolean(CLOUD_NAME);
