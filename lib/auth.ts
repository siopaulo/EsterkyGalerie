import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Jednotná admin guard pro Server Components / Actions.
 * V tomto projektu je model single-admin: každý přihlášený uživatel v Supabase Auth = admin.
 * Pokud se do budoucna přidají role, stačí tady přidat kontrolu nad user_metadata.
 */
export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/studio/login");
  }
  return { user, supabase };
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
