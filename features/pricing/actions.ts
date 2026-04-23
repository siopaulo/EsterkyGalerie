"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const itemSchema = z.object({
  id: z.string().uuid().optional(),
  section: z.string().min(1).max(80).default("default"),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  price_label: z.string().max(80).nullable().optional(),
  features: z.array(z.string().max(200)).default([]),
  sort_order: z.number().int().default(0),
});

export async function upsertPricingItemAction(input: z.infer<typeof itemSchema>) {
  await requireAdmin();
  const data = itemSchema.parse(input);
  const admin = createSupabaseAdmin();
  const row = {
    section: data.section,
    title: data.title,
    description: data.description ?? null,
    price_label: data.price_label ?? null,
    features: data.features,
    sort_order: data.sort_order,
  };
  if (data.id) {
    const { error } = await admin.from("pricing_items").update(row).eq("id", data.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from("pricing_items").insert(row);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/cenik");
  revalidatePath("/studio/cenik");
  return { ok: true };
}

export async function deletePricingItemAction(id: string) {
  await requireAdmin();
  const admin = createSupabaseAdmin();
  await admin.from("pricing_items").delete().eq("id", id);
  revalidatePath("/cenik");
  revalidatePath("/studio/cenik");
  return { ok: true };
}
