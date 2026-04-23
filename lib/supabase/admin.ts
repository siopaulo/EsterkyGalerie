import "server-only";
import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";

/**
 * Service-role klient – obchází RLS.
 * POUŽÍVEJ VÝHRADNĚ po ověření admin session na serveru.
 */
export function createSupabaseAdmin() {
  return createClient(serverEnv.supabaseUrl, serverEnv.supabaseServiceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
