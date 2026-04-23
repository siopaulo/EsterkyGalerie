import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AdminPageHeader } from "@/components/admin/page-header";
import { PhotoEditor } from "@/components/admin/photo-editor";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { cldUrl } from "@/lib/cloudinary-url";
import { getPhotoUsage } from "@/features/photos/actions";
import type { Photo, Tag } from "@/types/database";

type Params = Promise<{ id: string }>;

export default async function PhotoDetail({ params }: { params: Params }) {
  await requireAdmin();
  const { id } = await params;
  const admin = createSupabaseAdmin();

  const [{ data: photo }, { data: photoTags }, { data: allTags }, usage] = await Promise.all([
    admin.from("photos").select("*").eq("id", id).maybeSingle(),
    admin.from("photo_tags").select("tag_id, tags(*)").eq("photo_id", id),
    admin.from("tags").select("*").order("name"),
    getPhotoUsage(id),
  ]);

  if (!photo) notFound();

  const initialTagSlugs = ((photoTags ?? []) as { tag_id: string; tags: Tag | Tag[] }[])
    .flatMap((r) => (Array.isArray(r.tags) ? r.tags : [r.tags]))
    .filter(Boolean)
    .map((t) => (t as Tag).slug);

  return (
    <>
      <AdminPageHeader
        title={(photo as Photo).display_name}
        description="Úprava fotografie a jejích metadat."
        breadcrumbs={[
          { label: "Studio", href: "/studio" },
          { label: "Galerie", href: "/studio/galerie" },
          { label: (photo as Photo).display_name },
        ]}
      />
      <section className="grid gap-10 px-6 py-8 md:grid-cols-[1fr_420px] md:px-10">
        <div className="overflow-hidden rounded-md border border-border bg-muted">
          <Image
            src={cldUrl((photo as Photo).cloudinary_public_id, { width: 1200 })}
            alt={(photo as Photo).alt_text || (photo as Photo).display_name}
            width={Math.max(1, (photo as Photo).width ?? 1200)}
            height={Math.max(1, (photo as Photo).height ?? 800)}
            className="h-auto w-full object-contain"
            sizes="(min-width: 768px) 50vw, 100vw"
            priority
          />
          <div className="border-t border-border bg-background p-4 text-xs text-muted-foreground">
            <p>
              {(photo as Photo).width}×{(photo as Photo).height}
              {(photo as Photo).bytes ? ` · ${(((photo as Photo).bytes as number) / 1024).toFixed(0)} kB` : ""}
              {(photo as Photo).format ? ` · ${(photo as Photo).format}` : ""}
            </p>
            <p className="mt-1">
              Cloudinary public_id: <code className="rounded bg-muted px-1">{(photo as Photo).cloudinary_public_id}</code>
            </p>
          </div>
        </div>
        <div className="space-y-6">
          <PhotoEditor
            photo={photo as Photo}
            initialTagSlugs={initialTagSlugs}
            availableTags={(allTags ?? []) as Tag[]}
            usage={usage}
          />
          <div className="rounded-lg border border-border bg-background p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Použití
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              <li>Jako cover v příběhu: <strong>{usage.asCover}</strong></li>
              <li>V blocích příběhů: <strong>{usage.inStoryBlocks}</strong></li>
              <li>V blocích stránek: <strong>{usage.inPageBlocks}</strong></li>
              <li>Ve výběru pro hlavní stránku: <strong>{usage.inFeatured}</strong></li>
            </ul>
            {usage.total > 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Fotka je používána – při mazání bude z Cloudinary odstraněna až po vyřešení všech referencí.
              </p>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                Není nikde použita – bezpečné smazání.
              </p>
            )}
          </div>
          <div className="rounded-lg border border-border bg-background p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Zpět
            </p>
            <p className="mt-3 text-sm">
              <Link href="/studio/galerie" className="underline underline-offset-2 hover:text-accent">
                ← Zpět do galerie
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
