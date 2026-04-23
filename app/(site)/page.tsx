import type { Metadata } from "next";
import { BlockRenderer, type RenderableBlock } from "@/features/blocks/render";
import { collectPhotoIds } from "@/features/blocks/collect-ids";
import { getSiteSettings } from "@/features/site-settings/queries";
import { fetchPhotosByIds } from "@/features/photos/queries";
import { fetchStories } from "@/features/stories/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo";
import type { Photo, PageBlock } from "@/types/database";

export const metadata: Metadata = buildMetadata({
  title: null,
  description:
    "Editorial foto portfolio Esterky Fotky. Koně, portréty, příroda – tiché okamžiky zachycené s citem.",
  path: "/",
});

export const revalidate = 120;

const HOME_SLUG = "_home";

export default async function HomePage() {
  const settings = await getSiteSettings();
  const supabase = await createSupabaseServerClient();

  // Bloky homepage (_home). Pokud stránka neexistuje, renderer dostane prázdno
  // a zobrazí se pouze featured gallery sekce z fallback větve.
  const { data: page } = await supabase
    .from("pages")
    .select("id")
    .eq("slug", HOME_SLUG)
    .maybeSingle();

  const blocks: PageBlock[] = page
    ? (
        await supabase
          .from("page_blocks")
          .select("*")
          .eq("page_id", page.id)
          .order("sort_order", { ascending: true })
      ).data as PageBlock[] ?? []
    : [];

  // Featured fotky (1:1 se site_settings, fallback na is_featured_home příznak)
  const featured = await loadFeaturedPhotos(settings.featured_photo_ids);
  const { stories } = await fetchStories({ page: 1, perPage: 6 });

  // Sbíráme IDs z payloadů + fallback featured IDs (mohou být použity home bloky).
  const blockPhotoIds = collectPhotoIds(blocks as unknown as RenderableBlock[]);
  const allIds = Array.from(new Set([...blockPhotoIds, ...featured.map((p) => p.id)]));
  const photoList = allIds.length > 0 ? await fetchPhotosByIds(allIds) : [];
  const photoMap = new Map(photoList.map((p) => [p.id, p]));

  return (
    <div className="pb-20">
      <BlockRenderer
        blocks={blocks as unknown as RenderableBlock[]}
        photos={photoMap}
        context={{
          stories,
          featuredPhotos: featured,
          layout: "home",
        }}
      />
    </div>
  );
}

async function loadFeaturedPhotos(settingsIds: string[]): Promise<Photo[]> {
  if (settingsIds.length > 0) {
    const photos = await fetchPhotosByIds(settingsIds);
    const order = new Map(settingsIds.map((id, i) => [id, i]));
    return photos
      .filter((p) => p.visibility === "public" && !p.deleted_at)
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      .slice(0, 12);
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("photos")
    .select("*")
    .eq("visibility", "public")
    .eq("is_featured_home", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(12);
  return (data ?? []) as Photo[];
}
