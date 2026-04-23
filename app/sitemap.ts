import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";

const STATIC = [
  { path: "/", priority: 1.0 },
  { path: "/o-mne", priority: 0.8 },
  { path: "/sluzby", priority: 0.8 },
  { path: "/galerie", priority: 0.9 },
  { path: "/pribehy", priority: 0.8 },
  { path: "/cenik", priority: 0.7 },
  { path: "/reference", priority: 0.7 },
  { path: "/kontakt", priority: 0.7 },
  { path: "/ochrana-osobnich-udaju", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.siteUrl.replace(/\/$/, "");
  const now = new Date();

  const items: MetadataRoute.Sitemap = STATIC.map((s) => ({
    url: `${base}${s.path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: s.priority,
  }));

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("stories")
      .select("slug, updated_at, published_at")
      .lte("published_at", now.toISOString())
      .order("published_at", { ascending: false })
      .limit(1000);

    for (const row of data ?? []) {
      items.push({
        url: `${base}/pribehy/${row.slug}`,
        lastModified: new Date(row.updated_at),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch (err) {
    console.warn("[sitemap] nepodařilo se načíst příběhy", err);
  }

  return items;
}
