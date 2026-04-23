import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Photo, PhotoWithTags, Tag } from "@/types/database";

export async function fetchPhotosByIds(ids: string[]): Promise<Photo[]> {
  if (!ids.length) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("photos")
    .select("*")
    .in("id", ids)
    .eq("visibility", "public")
    .is("deleted_at", null);
  return (data ?? []) as Photo[];
}

export async function fetchPhotosByIdsKeepOrder(ids: string[]): Promise<(Photo | null)[]> {
  if (!ids.length) return [];
  const photos = await fetchPhotosByIds(ids);
  const byId = new Map(photos.map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id) ?? null);
}

export async function fetchPhotoById(id: string): Promise<Photo | null> {
  if (!id) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("photos")
    .select("*")
    .eq("id", id)
    .eq("visibility", "public")
    .is("deleted_at", null)
    .maybeSingle();
  return (data as Photo) ?? null;
}

export interface GalleryQuery {
  search?: string;
  tagSlugs?: string[];
  page?: number;
  perPage?: number;
}

export interface GalleryResult {
  photos: PhotoWithTags[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export async function fetchGallery(q: GalleryQuery): Promise<GalleryResult> {
  const page = Math.max(1, q.page ?? 1);
  const perPage = Math.min(60, Math.max(1, q.perPage ?? 24));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const supabase = await createSupabaseServerClient();

  // Když filtrujeme tagy, bereme SJEDNOCENÍ – fotka se ukáže, pokud má alespoň jeden ze zvolených tagů.
  let tagFilteredIds: string[] | null = null;
  if (q.tagSlugs && q.tagSlugs.length > 0) {
    const { data: tags } = await supabase
      .from("tags")
      .select("id, slug")
      .in("slug", q.tagSlugs);
    const tagIds = (tags ?? []).map((t) => t.id);
    if (!tagIds.length) {
      return { photos: [], total: 0, page, perPage, totalPages: 0 };
    }
    const { data: pt } = await supabase
      .from("photo_tags")
      .select("photo_id")
      .in("tag_id", tagIds);
    const unique = new Set<string>();
    for (const row of pt ?? []) unique.add(row.photo_id);
    tagFilteredIds = Array.from(unique);
    if (!tagFilteredIds.length) {
      return { photos: [], total: 0, page, perPage, totalPages: 0 };
    }
  }

  let query = supabase
    .from("photos")
    .select("*", { count: "exact" })
    .eq("visibility", "public")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (tagFilteredIds) query = query.in("id", tagFilteredIds);
  if (q.search && q.search.trim().length > 0) {
    const needle = `%${q.search.trim()}%`;
    query = query.or(`display_name.ilike.${needle},description.ilike.${needle}`);
  }

  const { data, count } = await query;
  const photos = (data ?? []) as Photo[];

  const photoIds = photos.map((p) => p.id);
  const tagMap = await fetchTagsForPhotoIds(photoIds);

  return {
    photos: photos.map((p) => ({ ...p, tags: tagMap.get(p.id) ?? [] })),
    total: count ?? 0,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / perPage)),
  };
}

async function fetchTagsForPhotoIds(photoIds: string[]): Promise<Map<string, Tag[]>> {
  if (!photoIds.length) return new Map();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("photo_tags")
    .select("photo_id, tags(*)")
    .in("photo_id", photoIds);

  const out = new Map<string, Tag[]>();
  for (const row of (data ?? []) as { photo_id: string; tags: Tag | Tag[] }[]) {
    const tag = Array.isArray(row.tags) ? row.tags[0] : row.tags;
    if (!tag) continue;
    const arr = out.get(row.photo_id) ?? [];
    arr.push(tag);
    out.set(row.photo_id, arr);
  }
  return out;
}

export async function fetchAllTags(): Promise<Tag[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("tags").select("*").order("name", { ascending: true });
  return (data ?? []) as Tag[];
}
