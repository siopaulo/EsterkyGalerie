import { AdminPageHeader } from "@/components/admin/page-header";
import { PhotoUploader } from "@/components/admin/photo-uploader";
import { GalleryFilterForm } from "@/components/admin/gallery-filter-form";
import { GalleryPhotoGrid } from "@/components/admin/gallery-photo-grid";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { Photo, Tag } from "@/types/database";
import { safeNumber } from "@/lib/utils";
import { Pagination } from "@/components/public/pagination";

type SP = Promise<{ [k: string]: string | string[] | undefined }>;

export default async function StudioGalleryPage({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const admin = createSupabaseAdmin();

  const page = Math.max(1, safeNumber(sp.page, 1));
  const perPage = 30;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const visibility = typeof sp.v === "string" ? sp.v : "all";

  let query = admin
    .from("photos")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (visibility === "public" || visibility === "hidden") {
    query = query.eq("visibility", visibility);
  }
  if (q) {
    const needle = `%${q}%`;
    query = query.or(`display_name.ilike.${needle},description.ilike.${needle},alt_text.ilike.${needle}`);
  }

  const [{ data, count }, { data: tags }] = await Promise.all([
    query,
    admin.from("tags").select("*").order("name"),
  ]);

  const photos = (data ?? []) as Photo[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / perPage));
  const autoOpen = sp.upload === "1";

  return (
    <>
      <AdminPageHeader
        title="Galerie"
        description="Centrální knihovna všech fotek. Nahrávejte, upravujte metadata, mažte bezpečně."
        actions={
          <PhotoUploader
            availableTags={(tags ?? []) as Tag[]}
            autoOpen={autoOpen}
            showMobileFab
          />
        }
      />

      <section className="max-w-full px-4 py-6 pb-24 md:px-10 md:py-8 md:pb-8">
        <GalleryFilterForm q={q} visibility={visibility} totalCount={count ?? 0} />

        {(count ?? 0) === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
            <p className="font-serif text-2xl">Galerie je prázdná</p>
            <p className="mt-2 text-sm text-muted-foreground">Nahrajte první fotku.</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
            <p className="font-serif text-2xl">Nic na této stránce</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Zkuste jinou stránku nebo upravte filtr.
            </p>
          </div>
        ) : (
          <GalleryPhotoGrid photos={photos} page={page} />
        )}

        {totalPages > 1 ? (
          <div className="mt-10">
            <Pagination
              page={page}
              totalPages={totalPages}
              baseQuery={sp}
              basePath="/studio/galerie"
            />
          </div>
        ) : null}
      </section>
    </>
  );
}
