import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SiteSettings } from "@/types/database";
import { SITE_DEFAULTS } from "@/lib/constants";

const FALLBACK: SiteSettings = {
  id: 1,
  site_name: SITE_DEFAULTS.name,
  site_tagline: SITE_DEFAULTS.tagline,
  default_seo_title: `${SITE_DEFAULTS.name} – ${SITE_DEFAULTS.tagline}`,
  default_seo_description: SITE_DEFAULTS.description,
  contact_email_public: "kontakt@domena.cz",
  contact_email_delivery_target: null,
  phone: null,
  instagram_url: null,
  facebook_url: null,
  address: null,
  logo_url: null,
  hero_texts: {},
  featured_photo_ids: [],
  featured_story_ids: [],
  updated_at: new Date().toISOString(),
};

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return FALLBACK;
    return {
      ...FALLBACK,
      ...(data as SiteSettings),
      hero_texts: (data as SiteSettings).hero_texts ?? {},
      featured_photo_ids: (data as SiteSettings).featured_photo_ids ?? [],
      featured_story_ids: (data as SiteSettings).featured_story_ids ?? [],
    };
  } catch {
    return FALLBACK;
  }
});
