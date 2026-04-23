"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const settingsSchema = z.object({
  site_name: z.string().min(1).max(120),
  site_tagline: z.string().max(200).nullable().optional(),
  default_seo_title: z.string().max(200).nullable().optional(),
  default_seo_description: z.string().max(400).nullable().optional(),
  contact_email_public: z.string().email().max(200).nullable().optional().or(z.literal("")),
  contact_email_delivery_target: z.string().email().max(200).nullable().optional().or(z.literal("")),
  phone: z.string().max(60).nullable().optional(),
  instagram_url: z.string().url().nullable().optional().or(z.literal("")),
  facebook_url: z.string().url().nullable().optional().or(z.literal("")),
  address: z.string().max(400).nullable().optional(),
  hero_texts: z.record(z.string(), z.string()).optional(),
  featured_photo_ids: z.array(z.string().uuid()).optional(),
  featured_story_ids: z.array(z.string().uuid()).optional(),
});

export async function updateSiteSettingsAction(input: z.infer<typeof settingsSchema>) {
  await requireAdmin();
  const data = settingsSchema.parse(input);
  const admin = createSupabaseAdmin();

  // Načti původní stav – potřebujeme featured_photo_ids pro synchronizaci flagu
  // na fotkách a hero_texts zachovat, pokud je UI tentokrát neposílá (blokový
  // editor homepage jej již nevyužívá, ale nechceme ho slepě přepisovat).
  const { data: prev } = await admin
    .from("site_settings")
    .select("featured_photo_ids, hero_texts")
    .eq("id", 1)
    .maybeSingle();
  const prevIds: string[] = (prev?.featured_photo_ids ?? []) as string[];
  const prevHeroTexts = (prev?.hero_texts ?? {}) as Record<string, string>;
  const nextIds: string[] = data.featured_photo_ids ?? [];

  const row = {
    id: 1,
    site_name: data.site_name,
    site_tagline: data.site_tagline || null,
    default_seo_title: data.default_seo_title || null,
    default_seo_description: data.default_seo_description || null,
    contact_email_public: data.contact_email_public || null,
    contact_email_delivery_target: data.contact_email_delivery_target || null,
    phone: data.phone || null,
    instagram_url: data.instagram_url || null,
    facebook_url: data.facebook_url || null,
    address: data.address || null,
    hero_texts: data.hero_texts ?? prevHeroTexts,
    featured_photo_ids: nextIds,
    featured_story_ids: data.featured_story_ids ?? [],
  };
  const { error } = await admin.from("site_settings").upsert(row, { onConflict: "id" });
  if (error) throw new Error(error.message);

  // Synchronizace photos.is_featured_home podle diffu proti původnímu seznamu.
  const added = nextIds.filter((id) => !prevIds.includes(id));
  const removed = prevIds.filter((id) => !nextIds.includes(id));
  if (added.length) {
    await admin.from("photos").update({ is_featured_home: true }).in("id", added);
  }
  if (removed.length) {
    await admin.from("photos").update({ is_featured_home: false }).in("id", removed);
  }

  revalidatePath("/", "layout");
  revalidatePath("/studio/nastaveni");
  revalidatePath("/studio/galerie");
  return { ok: true };
}
