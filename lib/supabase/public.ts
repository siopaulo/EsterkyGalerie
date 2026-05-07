import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";

/**
 * Read-only Supabase klient pro **veřejné** Server Components / sitemap / RSC,
 * které nepotřebují uživatelskou session.
 *
 * Proč existuje: `createSupabaseServerClient` z `@supabase/ssr` čte `cookies()`
 * a tím opt-inuje route segment do dynamic renderingu – `export const revalidate = X`
 * pak nepomáhá a každá public stránka jede přes SSR funkci na každý request,
 * což výrazně zvyšuje LCP a první načtení.
 *
 * Tento klient používá výhradně `anon` klíč, **ignoruje cookies/session** a tím
 * umožňuje statické / ISR renderování public stránek (homepage, /o-mne, /sluzby,
 * /pribehy, /galerie, /reference, /cenik). RLS chrání stejně jako u SSR klienta,
 * protože anon = neautentizovaný uživatel.
 *
 * NEPOUŽÍVAT pro `/studio` ani v Route Handlerech, kde záleží na session.
 */
let cachedClient: SupabaseClient | null = null;

export function createSupabasePublicReadClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  cachedClient = createClient(serverEnv.supabaseUrl, serverEnv.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      // Lehká identifikace pro server-side requesty.
      headers: { "x-application": "esterky-public-rsc" },
    },
  });
  return cachedClient;
}
