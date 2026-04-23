import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Photo, Story, StoryBlock, StoryWithMeta, Tag } from "@/types/database";

export interface StoriesQuery {
  search?: string;
  tagSlugs?: string[];
  page?: number;
  perPage?: number;
}

export interface StoriesResult {
  stories: StoryWithMeta[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export async function fetchStories(q: StoriesQuery): Promise<StoriesResult> {
  const page = Math.max(1, q.page ?? 1);
  const perPage = Math.min(30, Math.max(1, q.perPage ?? 9));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const supabase = await createSupabaseServerClient();

  // SJEDNOCENÍ – příběh se ukáže, pokud má alespoň jeden ze zvolených tagů.
  let tagFilteredIds: string[] | null = null;
  if (q.tagSlugs && q.tagSlugs.length > 0) {
    const { data: tags } = await supabase.from("tags").select("id").in("slug", q.tagSlugs);
    const tagIds = (tags ?? []).map((t) => t.id);
    if (!tagIds.length) return empty(page, perPage);
    const { data: st } = await supabase
      .from("story_tags")
      .select("story_id")
      .in("tag_id", tagIds);
    const unique = new Set<string>();
    for (const row of st ?? []) unique.add(row.story_id);
    tagFilteredIds = Array.from(unique);
    if (!tagFilteredIds.length) return empty(page, perPage);
  }

  let query = supabase
    .from("stories")
    .select("*", { count: "exact" })
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .range(from, to);

  if (tagFilteredIds) query = query.in("id", tagFilteredIds);
  if (q.search && q.search.trim().length > 0) {
    const needle = `%${q.search.trim()}%`;
    query = query.or(`title.ilike.${needle},excerpt.ilike.${needle}`);
  }

  const { data, count } = await query;
  const stories = (data ?? []) as Story[];

  const coverIds = stories.map((s) => s.cover_photo_id).filter((x): x is string => !!x);
  const tagMap = await fetchStoryTags(stories.map((s) => s.id));
  const coverMap = await fetchPhotosMap(coverIds);

  return {
    stories: stories.map((s) => ({
      ...s,
      cover_photo: s.cover_photo_id ? coverMap.get(s.cover_photo_id) ?? null : null,
      tags: tagMap.get(s.id) ?? [],
    })),
    total: count ?? 0,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / perPage)),
  };
}

export async function fetchStoryBySlug(slug: string): Promise<{
  story: Story;
  blocks: StoryBlock[];
  tags: Tag[];
  cover: Photo | null;
} | null> {
  const supabase = await createSupabaseServerClient();
  const { data: story } = await supabase
    .from("stories")
    .select("*")
    .eq("slug", slug)
    .lte("published_at", new Date().toISOString())
    .maybeSingle();
  if (!story) return null;

  const [{ data: blocks }, { data: tagRows }, coverMap] = await Promise.all([
    supabase
      .from("story_blocks")
      .select("*")
      .eq("story_id", story.id)
      .order("sort_order", { ascending: true }),
    supabase.from("story_tags").select("tags(*)").eq("story_id", story.id),
    story.cover_photo_id ? fetchPhotosMap([story.cover_photo_id]) : Promise.resolve(new Map<string, Photo>()),
  ]);

  const tags = ((tagRows ?? []) as { tags: Tag | Tag[] }[])
    .flatMap((r) => (Array.isArray(r.tags) ? r.tags : [r.tags]))
    .filter(Boolean) as Tag[];

  return {
    story: story as Story,
    blocks: (blocks ?? []) as StoryBlock[],
    tags,
    cover: story.cover_photo_id ? coverMap.get(story.cover_photo_id) ?? null : null,
  };
}

export async function fetchRelatedStories(storyId: string, tagIds: string[], limit = 3): Promise<StoryWithMeta[]> {
  const supabase = await createSupabaseServerClient();
  if (!tagIds.length) {
    const { data } = await supabase
      .from("stories")
      .select("*")
      .neq("id", storyId)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(limit);
    const stories = (data ?? []) as Story[];
    const coverMap = await fetchPhotosMap(stories.map((s) => s.cover_photo_id).filter((x): x is string => !!x));
    return stories.map((s) => ({
      ...s,
      cover_photo: s.cover_photo_id ? coverMap.get(s.cover_photo_id) ?? null : null,
      tags: [],
    }));
  }

  const { data: st } = await supabase
    .from("story_tags")
    .select("story_id")
    .in("tag_id", tagIds)
    .neq("story_id", storyId);
  const ids = Array.from(new Set((st ?? []).map((r) => r.story_id))).slice(0, 30);
  if (!ids.length) return [];

  const { data } = await supabase
    .from("stories")
    .select("*")
    .in("id", ids)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(limit);
  const stories = (data ?? []) as Story[];
  const coverMap = await fetchPhotosMap(stories.map((s) => s.cover_photo_id).filter((x): x is string => !!x));
  return stories.map((s) => ({
    ...s,
    cover_photo: s.cover_photo_id ? coverMap.get(s.cover_photo_id) ?? null : null,
    tags: [],
  }));
}

async function fetchStoryTags(storyIds: string[]): Promise<Map<string, Tag[]>> {
  if (!storyIds.length) return new Map();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("story_tags")
    .select("story_id, tags(*)")
    .in("story_id", storyIds);
  const out = new Map<string, Tag[]>();
  for (const row of (data ?? []) as { story_id: string; tags: Tag | Tag[] }[]) {
    const tag = Array.isArray(row.tags) ? row.tags[0] : row.tags;
    if (!tag) continue;
    const arr = out.get(row.story_id) ?? [];
    arr.push(tag);
    out.set(row.story_id, arr);
  }
  return out;
}

async function fetchPhotosMap(ids: string[]): Promise<Map<string, Photo>> {
  if (!ids.length) return new Map();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("photos")
    .select("*")
    .in("id", ids)
    .is("deleted_at", null);
  return new Map(((data ?? []) as Photo[]).map((p) => [p.id, p]));
}

function empty(page: number, perPage: number): StoriesResult {
  return { stories: [], total: 0, page, perPage, totalPages: 0 };
}
