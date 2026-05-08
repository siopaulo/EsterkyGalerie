import type { Metadata } from "next";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { getSiteSettings } from "@/features/site-settings/queries";
import { SITE_DEFAULTS } from "@/lib/constants";
import { publicEnv } from "@/lib/env";
import {
  absoluteUrl,
  resolveSiteBrand,
  stripLegacyBrandFromFreeText,
  stripLegacyBrandFromTitle,
} from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = resolveSiteBrand(settings.site_name);
  /** V záložce preferuj krátký název webu; dlouhý „výchozí title“ nech pro OG/sdílení. */
  const tabDefault = siteName;
  const shareTitle =
    stripLegacyBrandFromTitle(settings.default_seo_title?.trim() || "") || siteName;
  const description =
    stripLegacyBrandFromFreeText(
      settings.default_seo_description?.trim() || SITE_DEFAULTS.description,
    ) || SITE_DEFAULTS.description;

  // Default OG/Twitter image pro stránky, které nedefinují vlastní `images`
  // v `buildMetadata` (homepage, /galerie, /pribehy, /reference, /kontakt, …).
  // Stories s vlastní cover fotkou si v `metadataForCmsPage` / story metadata
  // přepíšou images na konkrétní Cloudinary URL.
  const defaultImage = absoluteUrl(SITE_DEFAULTS.ogImage);

  return {
    metadataBase: new URL(publicEnv.siteUrl),
    title: {
      default: tabDefault,
      template: `%s | ${siteName}`,
    },
    description,
    openGraph: {
      title: shareTitle,
      description,
      siteName,
      locale: SITE_DEFAULTS.locale,
      images: [
        {
          url: defaultImage,
          width: SITE_DEFAULTS.ogImageWidth,
          height: SITE_DEFAULTS.ogImageHeight,
          type: SITE_DEFAULTS.ogImageType,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
      images: [defaultImage],
    },
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader siteName={settings.site_name} tagline={settings.site_tagline ?? undefined} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <PublicFooter settings={settings} />
    </div>
  );
}
