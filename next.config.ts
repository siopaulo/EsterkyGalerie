import type { NextConfig } from "next";
import { createRequire } from "node:module";
import { withSentryConfig } from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === "production";

/**
 * Volitelný bundle analyzer – aktivuje se přes `ANALYZE=true pnpm build`
 * (alias `pnpm analyze`). Když není package nainstalovaný, build prostě
 * pokračuje bez analyzeru. Drží to konfiguraci robustní pro CI / Netlify,
 * kde balík nainstalován mít nemusíme.
 */
type NextWrapper = (cfg: NextConfig) => NextConfig;

function loadBundleAnalyzer(): NextWrapper {
  if (process.env.ANALYZE !== "true") return (c) => c;
  try {
    const localRequire = createRequire(import.meta.url);
    type AnalyzerOpts = { enabled?: boolean; openAnalyzer?: boolean };
    const factory = localRequire("@next/bundle-analyzer") as
      | ((opts?: AnalyzerOpts) => NextWrapper)
      | { default: (opts?: AnalyzerOpts) => NextWrapper };
    const create = typeof factory === "function" ? factory : factory.default;
    return create({ enabled: true, openAnalyzer: false });
  } catch {
    console.warn(
      "[next.config] ANALYZE=true ale @next/bundle-analyzer není instalovaný. Spusť `pnpm install`.",
    );
    return (c) => c;
  }
}

const withBundleAnalyzer = loadBundleAnalyzer();

/**
 * CSP v produkci – vyvážení bezpečnosti a Next.js (inline styly / skripty).
 * Turnstile, Cloudinary (obrázky + signed upload z klienta), Supabase a Cloudflare Analytics musí zůstat povolené.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://api.cloudinary.com https://*.supabase.co wss://*.supabase.co https://cloudflareinsights.com https://vitals.vercel-analytics.com https://*.ingest.de.sentry.io https://*.ingest.us.sentry.io https://*.ingest.sentry.io",
  "frame-src https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
    ] as { key: string; value: string }[];
    if (isProd) {
      securityHeaders.push({ key: "Content-Security-Policy", value: contentSecurityPolicy });
    }
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/studio/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
});
