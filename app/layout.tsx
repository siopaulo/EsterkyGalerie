import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";
import { buildMetadata, jsonLd } from "@/lib/seo";
import { publicEnv } from "@/lib/env";
import { getSiteSettings } from "@/features/site-settings/queries";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-sans-custom",
  weight: ["400", "500", "600"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-serif-custom",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = buildMetadata({});

export const viewport: Viewport = {
  themeColor: "#fbf8f3",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const cfToken = publicEnv.cfAnalyticsToken;

  return (
    <html
      lang="cs"
      className={`${inter.variable} ${cormorant.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLd({
            "@type": "WebSite",
            name: settings.site_name,
            url: publicEnv.siteUrl,
            inLanguage: "cs-CZ",
          })}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLd({
            "@type": "ProfessionalService",
            name: settings.site_name,
            description: settings.default_seo_description ?? undefined,
            url: publicEnv.siteUrl,
            email: settings.contact_email_public ?? undefined,
            telephone: settings.phone ?? undefined,
            sameAs: [settings.instagram_url, settings.facebook_url].filter(Boolean),
            areaServed: "CZ",
          })}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-foreground focus:px-4 focus:py-2 focus:text-background"
        >
          Přeskočit na obsah
        </a>
        {children}
        <Toaster />
        {cfToken ? (
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            strategy="afterInteractive"
            data-cf-beacon={JSON.stringify({ token: cfToken, spa: true })}
          />
        ) : null}
      </body>
    </html>
  );
}
