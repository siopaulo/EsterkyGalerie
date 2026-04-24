import { AdminPageHeader } from "@/components/admin/page-header";
import { SettingsEditor } from "@/components/admin/settings-editor";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { Photo, SiteSettings, Story } from "@/types/database";

export default async function StudioSettingsPage() {
  await requireAdmin();
  const admin = createSupabaseAdmin();
  const [{ data: settings }, { data: photos }, { data: stories }] = await Promise.all([
    admin.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    admin
      .from("photos")
      .select("id, display_name, cloudinary_public_id, alt_text, visibility")
      .eq("visibility", "public")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(300),
    admin
      .from("stories")
      .select("id, title, slug, published_at")
      .order("published_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Nastavení webu"
        description="Globální nastavení značky, kontaktů a featured obsahu."
      />
      <section className="max-w-full px-4 py-8 md:px-10">
        <SettingsEditor
          settings={settings as SiteSettings}
          availablePhotos={((photos ?? []) as Pick<Photo, "id" | "display_name" | "cloudinary_public_id" | "alt_text" | "visibility">[])}
          availableStories={((stories ?? []) as Pick<Story, "id" | "title" | "slug" | "published_at">[])}
        />
      </section>
    </>
  );
}
