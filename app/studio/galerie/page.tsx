import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { PhotoUploader } from "@/components/admin/photo-uploader";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { cldUrl } from "@/lib/cloudinary-url";
import type { Photo, Tag } from "@/types/database";
import { formatDateCs, safeNumber } from "@/lib/utils";
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
          />
        }
      />

      <section className="px-6 py-6 md:px-10 md:py-8">
        <form className="mb-6 flex flex-wrap items-center gap-3">
          <Input name="q" defaultValue={q} placeholder="Hledat…" className="max-w-xs" />
          <select
            name="v"
            defaultValue={visibility}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="all">Všechny</option>
            <option value="public">Veřejné</option>
            <option value="hidden">Skryté</option>
          </select>
          <button className="h-10 rounded-md border border-border px-4 text-sm hover:bg-muted">
            Filtrovat
          </button>
          {(q || visibility !== "all") ? (
            <Link href="/studio/galerie" className="text-sm text-muted-foreground underline underline-offset-4">
              Vymazat
            </Link>
          ) : null}
          <p className="ml-auto text-sm text-muted-foreground">
            {count ?? 0} položek
          </p>
        </form>

        {photos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
            <p className="font-serif text-2xl">Galerie je prázdná</p>
            <p className="mt-2 text-sm text-muted-foreground">Nahrajte první fotku.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {photos.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/studio/galerie/${p.id}`}
                  className="group relative block overflow-hidden rounded-md bg-muted"
                >
                  <img
                    src={cldUrl(p.cloudinary_public_id, { width: 500, crop: "fill", gravity: "auto" })}
                    alt={p.alt_text || p.display_name}
                    className="aspect-[4/5] w-full object-cover transition-transform group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="line-clamp-1 text-sm text-white">{p.display_name}</p>
                    <p className="text-xs text-white/70">{formatDateCs(p.created_at)}</p>
                  </div>
                  {p.visibility === "hidden" ? (
                    <Badge className="absolute left-2 top-2 bg-black/80 text-white">Skrytá</Badge>
                  ) : null}
                  {p.is_featured_home ? (
                    <Badge className="absolute right-2 top-2 bg-accent text-accent-foreground">Vybraná</Badge>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
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
