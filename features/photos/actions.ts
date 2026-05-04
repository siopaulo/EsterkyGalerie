"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { slugify } from "@/lib/slug";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  cloudinary_public_id: z.string().min(1),
  original_filename: z.string().nullable().optional(),
  display_name: z.string().min(1).max(200),
  alt_text: z.string().max(300).default(""),
  description: z.string().max(2000).nullable().optional(),
  visibility: z.enum(["public", "hidden"]).default("public"),
  exclude_from_gallery: z.boolean().default(false),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  bytes: z.number().int().nullable().optional(),
  format: z.string().max(16).nullable().optional(),
  is_featured_home: z.boolean().default(false),
  tag_slugs: z.array(z.string()).default([]),
  new_tag_names: z.array(z.string()).default([]),
});

export type UpsertPhotoInput = z.infer<typeof upsertSchema>;

export async function upsertPhotoAction(input: UpsertPhotoInput) {
  await requireAdmin();
  const parsed = upsertSchema.parse(input);
  const admin = createSupabaseAdmin();

  // Insert / update photo
  let photoId = parsed.id;
  if (photoId) {
    const { error } = await admin
      .from("photos")
      .update({
        display_name: parsed.display_name,
        alt_text: parsed.alt_text,
        description: parsed.description ?? null,
        visibility: parsed.visibility,
        exclude_from_gallery: parsed.exclude_from_gallery,
        is_featured_home: parsed.is_featured_home,
        width: parsed.width ?? null,
        height: parsed.height ?? null,
        bytes: parsed.bytes ?? null,
        format: parsed.format ?? null,
      })
      .eq("id", photoId);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await admin
      .from("photos")
      .insert({
        cloudinary_public_id: parsed.cloudinary_public_id,
        original_filename: parsed.original_filename ?? null,
        display_name: parsed.display_name,
        alt_text: parsed.alt_text,
        description: parsed.description ?? null,
        visibility: parsed.visibility,
        exclude_from_gallery: parsed.exclude_from_gallery,
        is_featured_home: parsed.is_featured_home,
        width: parsed.width ?? null,
        height: parsed.height ?? null,
        bytes: parsed.bytes ?? null,
        format: parsed.format ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    photoId = data.id as string;
  }

  // Tags: zajisti existenci + napoj
  const tagIds: string[] = [];
  const allSlugs = [...parsed.tag_slugs];

  for (const newName of parsed.new_tag_names) {
    const name = newName.trim();
    if (!name) continue;
    const slug = slugify(name);
    if (!slug) continue;
    const { data: existing } = await admin.from("tags").select("id").eq("slug", slug).maybeSingle();
    if (existing?.id) {
      tagIds.push(existing.id);
    } else {
      const { data: inserted } = await admin
        .from("tags")
        .insert({ name, slug })
        .select("id")
        .single();
      if (inserted?.id) tagIds.push(inserted.id);
    }
    allSlugs.push(slug);
  }

  if (allSlugs.length) {
    const { data: resolved } = await admin.from("tags").select("id").in("slug", allSlugs);
    for (const r of resolved ?? []) if (!tagIds.includes(r.id)) tagIds.push(r.id);
  }

  // Replace photo_tags
  await admin.from("photo_tags").delete().eq("photo_id", photoId);
  if (tagIds.length) {
    await admin.from("photo_tags").insert(tagIds.map((tag_id) => ({ photo_id: photoId, tag_id })));
  }

  // Synchronizace „vybraná na hlavní stránku“ s site_settings.featured_photo_ids,
  // aby byly galerie a nastavení 1:1.
  await syncFeaturedPhotoInSettings(photoId!, parsed.is_featured_home);

  revalidatePath("/");
  revalidatePath("/galerie");
  revalidatePath("/studio/galerie");
  revalidatePath("/studio/nastaveni");
  return { id: photoId };
}

/**
 * Udržuje konzistenci mezi photos.is_featured_home a site_settings.featured_photo_ids.
 * - Pokud je fotka featured a není v seznamu, přidá ji na konec.
 * - Pokud featured není, odstraní ji ze seznamu.
 */
async function syncFeaturedPhotoInSettings(photoId: string, featured: boolean) {
  const admin = createSupabaseAdmin();
  const { data: settings } = await admin
    .from("site_settings")
    .select("featured_photo_ids")
    .eq("id", 1)
    .maybeSingle();
  const current: string[] = (settings?.featured_photo_ids ?? []) as string[];
  const isInList = current.includes(photoId);
  let next = current;
  if (featured && !isInList) next = [...current, photoId];
  if (!featured && isInList) next = current.filter((id) => id !== photoId);
  if (next === current) return;
  await admin
    .from("site_settings")
    .upsert({ id: 1, featured_photo_ids: next }, { onConflict: "id" });
}

/**
 * Soft-delete fotky – v DB zůstane s deleted_at, public web ji už neuvidí.
 * Cloudinary asset mažeme jen pokud fotka není nikde referencovaná.
 */
export async function softDeletePhotoAction(photoId: string, hardDeleteCloudinary: boolean) {
  await requireAdmin();
  const admin = createSupabaseAdmin();

  const { data: photo } = await admin
    .from("photos")
    .select("id, cloudinary_public_id")
    .eq("id", photoId)
    .maybeSingle();
  if (!photo) return { ok: false, error: "Fotka neexistuje" };

  // Soft delete
  await admin.from("photos").update({ deleted_at: new Date().toISOString(), visibility: "hidden" }).eq("id", photoId);

  if (hardDeleteCloudinary) {
    // Zkontroluj, zda je ještě někde referencovaná
    const usage = await getPhotoUsage(photo.id);
    if (usage.total === 0) {
      await deleteFromCloudinary(photo.cloudinary_public_id);
    }
  }

  revalidatePath("/galerie");
  revalidatePath("/studio/galerie");
  return { ok: true };
}

const bulkDeleteSchema = z.array(z.string().uuid()).min(1).max(40);

/**
 * Hromadné soft-smazání fotek (stejná logika jako u jednotlivého mazání).
 * Po dokončení jednou invaliduje cache.
 */
export async function bulkSoftDeletePhotosAction(
  photoIds: string[],
  hardDeleteCloudinary: boolean,
): Promise<{ ok: true; deleted: number } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = bulkDeleteSchema.safeParse(photoIds);
  if (!parsed.success) {
    return { ok: false, error: "Neplatný výběr fotek (max. 40 najednou)." };
  }

  const admin = createSupabaseAdmin();
  let deleted = 0;
  for (const photoId of parsed.data) {
    const { data: photo } = await admin
      .from("photos")
      .select("id, cloudinary_public_id")
      .eq("id", photoId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!photo) continue;

    await admin
      .from("photos")
      .update({ deleted_at: new Date().toISOString(), visibility: "hidden" })
      .eq("id", photoId);

    if (hardDeleteCloudinary) {
      const usage = await getPhotoUsage(photo.id);
      if (usage.total === 0) {
        await deleteFromCloudinary(photo.cloudinary_public_id);
      }
    }
    deleted += 1;
  }

  revalidatePath("/");
  revalidatePath("/galerie");
  revalidatePath("/studio/galerie");
  revalidatePath("/studio/nastaveni");
  return { ok: true, deleted };
}

/**
 * Spočítá využití fotky napříč systémem. Scanuje všechny block payloady aplikačně,
 * protože reference na fotky jsou v různých polích (photo_id, photo_ids[], left/right_photo_id,
 * background_photo_id, cover_photo_id). Zahrnuje i odkazy v site_settings (featured) –
 * pro bezpečný hard-delete potřebujeme úplný přehled.
 */
export async function getPhotoUsage(photoId: string) {
  const admin = createSupabaseAdmin();
  const [{ count: asCover }, { data: storyBlocks }, { data: pageBlocks }, { data: settings }] = await Promise.all([
    admin.from("stories").select("id", { count: "exact", head: true }).eq("cover_photo_id", photoId),
    admin.from("story_blocks").select("payload").limit(5000),
    admin.from("page_blocks").select("payload").limit(5000),
    admin.from("site_settings").select("featured_photo_ids").eq("id", 1).maybeSingle(),
  ]);

  const inStoryBlocks = countPhotoIdInBlocks(storyBlocks ?? [], photoId);
  const inPageBlocks = countPhotoIdInBlocks(pageBlocks ?? [], photoId);
  const inFeatured = (settings?.featured_photo_ids ?? []).includes(photoId) ? 1 : 0;
  const total = (asCover ?? 0) + inStoryBlocks + inPageBlocks + inFeatured;

  return {
    total,
    asCover: asCover ?? 0,
    inStoryBlocks,
    inPageBlocks,
    inFeatured,
  };
}

/**
 * Defenzivní scan všech možných polí v payloadu, které mohou obsahovat reference na fotku.
 * Nespoléhá na konkrétní schéma bloku – dostaneme tím i případné budoucí rozšíření.
 */
function countPhotoIdInBlocks(rows: { payload: unknown }[], photoId: string): number {
  let count = 0;
  for (const row of rows) {
    if (payloadReferencesPhoto(row.payload, photoId)) count++;
  }
  return count;
}

function payloadReferencesPhoto(payload: unknown, photoId: string): boolean {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  const scalarKeys = ["photo_id", "left_photo_id", "right_photo_id", "background_photo_id", "cover_photo_id"];
  for (const k of scalarKeys) {
    if (p[k] === photoId) return true;
  }
  const ids = p.photo_ids;
  if (Array.isArray(ids) && ids.includes(photoId)) return true;
  return false;
}
