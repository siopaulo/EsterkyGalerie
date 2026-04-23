/**
 * Centralizované zpracování env proměnných.
 * Pro server-only hodnoty se snažíme selhat brzy a jasně.
 */

function req(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(`Chybí env proměnná ${name}. Zkontroluj .env.`);
  }
  return value;
}

function opt(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

export const publicEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
  cloudinaryCloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "",
  cfAnalyticsToken: process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN ?? "",
};

export const serverEnv = {
  get supabaseUrl() {
    return req("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabaseAnonKey() {
    return req("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  },
  get supabaseServiceRole() {
    return req("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
  },
  get cloudinary() {
    return {
      cloudName: req("CLOUDINARY_CLOUD_NAME", process.env.CLOUDINARY_CLOUD_NAME),
      apiKey: req("CLOUDINARY_API_KEY", process.env.CLOUDINARY_API_KEY),
      apiSecret: req("CLOUDINARY_API_SECRET", process.env.CLOUDINARY_API_SECRET),
      folder: process.env.CLOUDINARY_UPLOAD_FOLDER ?? "esterky/photos",
    };
  },
  /**
   * Resend je úmyslně měkce konfigurovaný – pokud není k dispozici, kontaktní
   * formulář stále funguje (zprávy se uloží do DB + zalogují). To odpovídá
   * požadavku „funguje i bez Resend (fallback log)“.
   */
  get resend() {
    return {
      apiKey: opt(process.env.RESEND_API_KEY),
      from: opt(process.env.RESEND_FROM),
      to: opt(process.env.CONTACT_DELIVERY_EMAIL),
      get configured() {
        return Boolean(
          process.env.RESEND_API_KEY &&
            process.env.RESEND_FROM &&
            process.env.CONTACT_DELIVERY_EMAIL,
        );
      },
    };
  },
  get turnstile() {
    return {
      secret: opt(process.env.TURNSTILE_SECRET_KEY),
    };
  },
};
