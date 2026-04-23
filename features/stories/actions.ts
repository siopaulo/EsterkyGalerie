"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slug";
import { parseBlockPayload } from "@/features/blocks/schemas";

const storyMetaSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  excerpt: z.string().max(500).nullable().optional(),
  cover_photo_id: z.string().uuid().nullable().optional(),
  published_at: z.string().optional(),
  seo_title: z.string().max(200).nullable().optional(),
  seo_description: z.string().max(400).nullable().optional(),
  tag_slugs: z.array(z.string()).default([]),
});

export async function upsertStoryAction(input: z.infer<typeof storyMetaSchema>) {
  await requireAdmin();
  const data = storyMetaSchema.parse(input);
  const admin = createSupabaseAdmin();

  const slug = slugify(data.slug || data.title);
  let storyId = data.id;

  if (storyId) {
    const { error } = await admin
      .from("stories")
      .update({
        title: data.title,
        slug,
        excerpt: data.excerpt ?? null,
        cover_photo_id: data.cover_photo_id ?? null,
        published_at: data.published_at ?? new Date().toISOString(),
        seo_title: data.seo_title ?? null,
        seo_description: data.seo_description ?? null,
      })
      .eq("id", storyId);
    if (error) throw new Error(error.message);
  } else {
    const { data: inserted, error } = await admin
      .from("stories")
      .insert({
        title: data.title,
        slug,
        excerpt: data.excerpt ?? null,
        cover_photo_id: data.cover_photo_id ?? null,
        published_at: data.published_at ?? new Date().toISOString(),
        seo_title: data.seo_title ?? null,
        seo_description: data.seo_description ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    storyId = inserted.id as string;
  }

  // Tags
  if (data.tag_slugs.length) {
    const { data: tagRows } = await admin.from("tags").select("id, slug").in("slug", data.tag_slugs);
    const existingSlugs = new Set((tagRows ?? []).map((t) => t.slug));
    const tagIds: string[] = (tagRows ?? []).map((t) => t.id);

    for (const slugCandidate of data.tag_slugs) {
      if (existingSlugs.has(slugCandidate)) continue;
      const name = slugCandidate.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
      const { data: inserted } = await admin
        .from("tags")
        .insert({ name, slug: slugCandidate })
        .select("id")
        .single();
      if (inserted?.id) tagIds.push(inserted.id);
    }
    await admin.from("story_tags").delete().eq("story_id", storyId);
    if (tagIds.length) {
      await admin.from("story_tags").insert(tagIds.map((tag_id) => ({ story_id: storyId, tag_id })));
    }
  } else {
    await admin.from("story_tags").delete().eq("story_id", storyId);
  }

  revalidatePath("/pribehy");
  revalidatePath(`/pribehy/${slug}`);
  revalidatePath("/studio/pribehy");
  return { id: storyId, slug };
}

export async function deleteStoryAction(id: string, _opts: { deletePhotos?: boolean } = {}) {
  await requireAdmin();
  const admin = createSupabaseAdmin();
  // Fotky v této verzi mažeme individuálně z galerie – tady jen smažeme příběh.
  await admin.from("stories").delete().eq("id", id);
  revalidatePath("/pribehy");
  revalidatePath("/studio/pribehy");
  return { ok: true };
}

const _blockInputSchema = z.object({
  id: z.string().uuid().optional(),
  block_type: z.string(),
  sort_order: z.number().int().optional(),
  payload: z.unknown(),
});

export async function saveStoryBlocksAction(storyId: string, blocks: z.infer<typeof _blockInputSchema>[]) {
  await requireAdmin();
  const admin = createSupabaseAdmin();

  // Validate payloads (but persist even if invalid – renderer má fallback; admin vidí warning).
  for (const b of blocks) {
    const parsed = parseBlockPayload(b.block_type, b.payload);
    if (!parsed.ok) {
      throw new Error(`Blok ${b.block_type}: ${parsed.error}`);
    }
  }

  // Strategie: smaž všechny bloky příběhu a vlož znovu (jednoduché, bezpečné pro malé objemy).
  await admin.from("story_blocks").delete().eq("story_id", storyId);
  if (blocks.length) {
    const payloadRows = blocks.map((b, i) => ({
      story_id: storyId,
      block_type: b.block_type,
      sort_order: i,
      payload: b.payload as object,
    }));
    const { error } = await admin.from("story_blocks").insert(payloadRows);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/studio/pribehy");
  return { ok: true };
}

export async function createNewStoryAndRedirect(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Zadejte název příběhu.");
  const admin = createSupabaseAdmin();
  const baseSlug = slugify(title);
  let slug = baseSlug || `pribeh-${Date.now()}`;
  // zajisti unikátnost
  for (let i = 2; i < 50; i++) {
    const { data: exists } = await admin.from("stories").select("id").eq("slug", slug).maybeSingle();
    if (!exists) break;
    slug = `${baseSlug}-${i}`;
  }
  const { data, error } = await admin
    .from("stories")
    .insert({ title, slug, published_at: new Date().toISOString() })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  redirect(`/studio/pribehy/${data.id}`);
}
