/**
 * Klient-safe helpery pro Cloudinary URL.
 * Žádné secrets – pouze veřejný cloud name.
 */
import { publicEnv } from "@/lib/env";

const CLOUD_NAME = publicEnv.cloudinaryCloudName;
const PLACEHOLDER = "/placeholder.svg";

if (typeof window !== "undefined" && !CLOUD_NAME) {
  // eslint-disable-next-line no-console
  console.warn(
    "[cloudinary] NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME není nastaveno. " +
      "Obrázky se nezobrazí – přidej proměnnou do .env.local a restartuj dev server.",
  );
}

export type CldVariant = {
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "limit" | "thumb";
  gravity?: "auto" | "face" | "faces" | "center";
  quality?: "auto" | "auto:best" | "auto:good" | "auto:eco";
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

export const GALLERY_WIDTHS = [320, 480, 640, 800, 1080, 1440];
export const FULL_WIDTHS = [640, 960, 1280, 1600, 2000, 2400];

export const CLOUDINARY_CONFIGURED = Boolean(CLOUD_NAME);
