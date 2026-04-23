import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Page, PageBlock } from "@/types/database";

export async function fetchPageBySlug(slug: string): Promise<{
  page: Page;
  blocks: PageBlock[];
} | null> {
  const supabase = await createSupabaseServerClient();
  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!page) return null;

  const { data: blocks } = await supabase
    .from("page_blocks")
    .select("*")
    .eq("page_id", page.id)
    .order("sort_order", { ascending: true });

  return { page: page as Page, blocks: (blocks ?? []) as PageBlock[] };
}
