import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/features/site-settings/queries";
import { resolveSiteBrand } from "@/lib/seo";

/**
 * Minimální produkční Web App Manifest.
 *
 * Účel:
 *  - Lighthouse / PWA hygiena (ikona + theme color při „Přidat na plochu“).
 *  - Žádný service worker, žádný offline mode – portfolio nepotřebuje plnou PWA.
 *
 * `theme_color` a `background_color` zarovnány s `app/globals.css` (cream pozadí).
 * Ikony mají ostrý square i `maskable` variant pro Android adaptivní ikony.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings();
  const name = resolveSiteBrand(settings.site_name);
  return {
    name,
    short_name: name,
    description:
      settings.default_seo_description?.trim() ||
      "Editorial foto portfolio.",
    start_url: "/",
    scope: "/",
    display: "minimal-ui",
    orientation: "portrait",
    background_color: "#fbf8f3",
    theme_color: "#fbf8f3",
    lang: "cs-CZ",
    dir: "ltr",
    categories: ["photography", "lifestyle", "portfolio"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
