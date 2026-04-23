"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slug";

const tagSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(80),
});

export async function upsertTagAction(input: z.infer<typeof tagSchema>) {
  await requireAdmin();
  const data = tagSchema.parse(input);
  const slug = slugify(data.name);
  const admin = createSupabaseAdmin();
  if (data.id) {
    const { error } = await admin.from("tags").update({ name: data.name, slug }).eq("id", data.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from("tags").insert({ name: data.name, slug });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/galerie");
  revalidatePath("/pribehy");
  revalidatePath("/studio/tagy");
  return { ok: true };
}

export async function deleteTagAction(id: string) {
  await requireAdmin();
  const admin = createSupabaseAdmin();
  await admin.from("tags").delete().eq("id", id);
  revalidatePath("/galerie");
  revalidatePath("/pribehy");
  revalidatePath("/studio/tagy");
  return { ok: true };
}
