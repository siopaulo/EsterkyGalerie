import { cookies } from "next/headers";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { serverEnv } from "@/lib/env";

/**
 * Supabase klient pro Server Components / Route Handlers / Server Actions.
 * Používá uživatelskou session (RLS je plně respektováno).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(serverEnv.supabaseUrl, serverEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Parameters<NonNullable<CookieMethodsServer["setAll"]>>[0]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // volání v čistém RSC (bez actions) – ignorujeme
        }
      },
    },
  });
}

/**
 * Read-only klient pro veřejná data v RSC (bez nutnosti session zápisu).
 */
export async function createSupabasePublicClient() {
  return createSupabaseServerClient();
}
