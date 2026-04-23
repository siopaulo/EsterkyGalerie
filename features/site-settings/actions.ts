"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

/** Prázdný string / null z formuláře → null do DB. */
function emptyToNullString() {
  return z
    .union([z.string(), z.literal(""), z.null()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null) return null;
      const t = v.trim();
      return t === "" ? null : t;
    });
}

function optionalEmail(message: string) {
  return z
    .union([z.string().max(200), z.literal(""), z.null()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null) return null;
      const t = v.trim();
      return t === "" ? null : t;
    })
    .refine((v) => v === null || z.string().email().safeParse(v).success, { message });
}

function optionalHttpUrl(message: string) {
  return z
    .union([z.string().max(500), z.literal(""), z.null()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null) return null;
      const t = v.trim();
      return t === "" ? null : t;
    })
    .superRefine((val, ctx) => {
      if (val === null) return;
      try {
        const u = new URL(val);
        if (u.protocol !== "http:" && u.protocol !== "https:") {
          ctx.addIssue({ code: "custom", message: `${message} (musí začínat http:// nebo https://)` });
        }
      } catch {
        ctx.addIssue({ code: "custom", message });
      }
    });
}

const settingsSchema = z.object({
  site_name: z.string().trim().min(1, "Název webu je povinný.").max(120, "Název webu je příliš dlouhý."),
  site_tagline: emptyToNullString(),
  default_seo_title: emptyToNullString(),
  default_seo_description: emptyToNullString(),
  contact_email_public: optionalEmail("Veřejný e-mail není ve platném tvaru."),
  contact_email_delivery_target: optionalEmail("Doručovací e-mail není ve platném tvaru."),
  phone: emptyToNullString(),
  instagram_url: optionalHttpUrl("Instagram: zadejte platnou URL (např. https://instagram.com/…)."),
  facebook_url: optionalHttpUrl("Facebook: zadejte platnou URL (např. https://facebook.com/…)."),
  address: emptyToNullString(),
  hero_texts: z.record(z.string(), z.string()).optional(),
  featured_photo_ids: z.array(z.string().uuid("Neplatné ID fotky.")).default([]),
  featured_story_ids: z.array(z.string().uuid("Neplatné ID příběhu.")).default([]),
});

export type UpdateSiteSettingsResult =
  | { ok: true }
  | { ok: false; error: string; fields?: Record<string, string> };

function zodToFieldMap(err: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && fields[key] == null) {
      fields[key] = issue.message;
    }
  }
  return fields;
}

export async function updateSiteSettingsAction(input: unknown): Promise<UpdateSiteSettingsResult> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    const fields = zodToFieldMap(parsed.error);
    const first = parsed.error.issues[0]?.message ?? "Neplatná data.";
    return { ok: false, error: first, fields };
  }

  const data = parsed.data;
  const admin = createSupabaseAdmin();

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
    site_tagline: data.site_tagline ?? null,
    default_seo_title: data.default_seo_title ?? null,
    default_seo_description: data.default_seo_description ?? null,
    contact_email_public: data.contact_email_public ?? null,
    contact_email_delivery_target: data.contact_email_delivery_target ?? null,
    phone: data.phone ?? null,
    instagram_url: data.instagram_url ?? null,
    facebook_url: data.facebook_url ?? null,
    address: data.address ?? null,
    hero_texts: data.hero_texts ?? prevHeroTexts,
    featured_photo_ids: nextIds,
    featured_story_ids: data.featured_story_ids ?? [],
  };
  const { error } = await admin.from("site_settings").upsert(row, { onConflict: "id" });
  if (error) {
    return { ok: false, error: `Uložení do databáze selhalo: ${error.message}` };
  }

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
