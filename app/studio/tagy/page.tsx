import { AdminPageHeader } from "@/components/admin/page-header";
import { TagsManager } from "@/components/admin/tags-manager";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { Tag } from "@/types/database";

export default async function StudioTagsPage() {
  await requireAdmin();
  const admin = createSupabaseAdmin();
  const { data } = await admin.from("tags").select("*").order("name");
  return (
    <>
      <AdminPageHeader
        title="Tagy"
        description="Štítky pro fotky i příběhy. Mazáním se odstraní ze všech navázaných položek."
      />
      <section className="mx-auto max-w-full px-4 py-8 md:max-w-3xl md:px-10">
        <TagsManager initialTags={(data ?? []) as Tag[]} />
      </section>
    </>
  );
}
