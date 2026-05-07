import { BlockRenderer } from "@/features/blocks/render";
import { collectPhotoIds } from "@/features/blocks/collect-ids";
import { getSiteSettings } from "@/features/site-settings/queries";
import { fetchPhotosByIds } from "@/features/photos/queries";
import { fetchStories } from "@/features/stories/queries";
import { createSupabasePublicReadClient } from "@/lib/supabase/public";
import { HeroPreloadHints } from "@/components/public/hero-preload-hints";
import type { Photo, PageBlock } from "@/types/database";

export const revalidate = 120;

const HOME_SLUG = "_home";

export default async function HomePage() {
  const settings = await getSiteSettings();
  const supabase = createSupabasePublicReadClient();

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
  const blockPhotoIds = collectPhotoIds(blocks);
  const allIds = Array.from(new Set([...blockPhotoIds, ...featured.map((p) => p.id)]));
  const photoList = allIds.length > 0 ? await fetchPhotosByIds(allIds) : [];
  const photoMap = new Map(photoList.map((p) => [p.id, p]));

  // Pro LCP – preload hint na první hero fotku (carousel slide #0).
  // Pomáhá browseru objevit obrázek dřív, než stihne hydratovat carousel.
  const heroPhoto = resolveHomeHeroLcp(blocks, photoMap, featured);

  return (
    <div className="pb-20">
      {heroPhoto ? <HeroPreloadHints photo={heroPhoto} /> : null}
      <BlockRenderer
        blocks={blocks}
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
  const supabase = createSupabasePublicReadClient();
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

/**
 * Vrátí první foto, kterou by carousel/hero v home_hero bloku zobrazil.
 * Slouží k vystavení preload hintu už v HTML head, aby se LCP image nečekal
 * na hydrataci client carouselu.
 */
function resolveHomeHeroLcp(
  blocks: PageBlock[],
  photoMap: Map<string, Photo>,
  featured: Photo[],
): Photo | null {
  // Najdi první home_hero block (pokud existuje).
  const heroBlock = blocks.find((b) => b.block_type === "home_hero");
  if (heroBlock) {
    const payload = heroBlock.payload as { photo_ids?: string[] } | null;
    const ids = Array.isArray(payload?.photo_ids) ? payload.photo_ids : [];
    const firstId = ids[0];
    if (firstId) {
      const first = photoMap.get(firstId);
      if (first) return first;
    }
    return featured[0] ?? null;
  }
  // Když žádný home_hero block neexistuje, jako LCP se obvykle ukáže
  // první featured fotka v gallery carouselu.
  return featured[0] ?? null;
}
