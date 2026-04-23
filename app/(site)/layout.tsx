import type { Metadata } from "next";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { getSiteSettings } from "@/features/site-settings/queries";
import { SITE_DEFAULTS } from "@/lib/constants";
import { publicEnv } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = settings.site_name?.trim() || SITE_DEFAULTS.name;
  const defaultTitle = settings.default_seo_title?.trim() || siteName;
  const description = settings.default_seo_description?.trim() || SITE_DEFAULTS.description;

  return {
    metadataBase: new URL(publicEnv.siteUrl),
    title: {
      default: defaultTitle,
      template: `%s | ${siteName}`,
    },
    description,
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
