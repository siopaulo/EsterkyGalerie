"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { parseBlockPayload } from "@/features/blocks/schemas";

const pageSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  intro: z.string().max(2000).nullable().optional(),
  seo_title: z.string().max(200).nullable().optional(),
  seo_description: z.string().max(400).nullable().optional(),
});

export async function updatePageMetaAction(input: z.infer<typeof pageSchema>) {
  await requireAdmin();
  const data = pageSchema.parse(input);
  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("pages")
    .update({
      title: data.title,
      intro: data.intro ?? null,
      seo_title: data.seo_title ?? null,
      seo_description: data.seo_description ?? null,
    })
    .eq("id", data.id);
  if (error) throw new Error(error.message);

  // revaliduj všechny statické stránky + homepage
  revalidatePath("/");
  for (const p of ["o-mne", "sluzby", "cenik", "kontakt", "ochrana-osobnich-udaju"]) {
    revalidatePath(`/${p}`);
  }
  revalidatePath("/studio/stranky");
  return { ok: true };
}

const blockInputSchema = z.object({
  id: z.string().uuid().optional(),
  block_type: z.string(),
  sort_order: z.number().int().optional(),
  payload: z.unknown(),
});

export async function savePageBlocksAction(pageId: string, blocks: z.infer<typeof blockInputSchema>[]) {
  await requireAdmin();
  const admin = createSupabaseAdmin();
  for (const b of blocks) {
    const parsed = parseBlockPayload(b.block_type, b.payload);
    if (!parsed.ok) throw new Error(`Blok ${b.block_type}: ${parsed.error}`);
  }
  await admin.from("page_blocks").delete().eq("page_id", pageId);
  if (blocks.length) {
    const rows = blocks.map((b, i) => ({
      page_id: pageId,
      block_type: b.block_type,
      sort_order: i,
      payload: b.payload as object,
    }));
    const { error } = await admin.from("page_blocks").insert(rows);
    if (error) throw new Error(error.message);
  }
  // Cílená revalidace podle slug – homepage je speciální.
  const { data: page } = await admin.from("pages").select("slug").eq("id", pageId).maybeSingle();
  if (page?.slug === "_home") {
    revalidatePath("/");
  } else if (page?.slug) {
    revalidatePath(`/${page.slug}`);
  }
  revalidatePath("/studio/stranky");
  return { ok: true };
}
