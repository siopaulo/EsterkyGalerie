import type { Metadata } from "next";
import { fetchPageBySlug } from "@/features/pages/queries";
import { BlockRenderer } from "@/features/blocks/render";
import { collectPhotoIds } from "@/features/blocks/collect-ids";
import { fetchPhotosByIds } from "@/features/photos/queries";
import { metadataForCmsPage } from "@/lib/seo";
import { getSiteSettings } from "@/features/site-settings/queries";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const [data, settings] = await Promise.all([
    fetchPageBySlug("novinky"),
    getSiteSettings(),
  ]);
  return metadataForCmsPage({
    page: data?.page,
    path: "/novinky",
    fallbackTitle: "Novinky",
    siteName: settings.site_name,
  });
}

export default async function NovinkyPage() {
  const data = await fetchPageBySlug("novinky");

  const photoIds = data ? collectPhotoIds(data.blocks) : [];
  const photos = photoIds.length ? await fetchPhotosByIds(photoIds) : [];
  const photoMap = new Map(photos.map((p) => [p.id, p]));

  return (
    <>
      <header className="container-site py-14 md:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Novinky
        </p>
        <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-tight md:text-6xl">
          {data?.page.title ?? "Novinky"}
        </h1>
        {data?.page.intro ? (
          <p className="mt-6 max-w-2xl whitespace-pre-line text-lg text-muted-foreground">
            {data.page.intro}
          </p>
        ) : null}
      </header>

      <section className="container-site pb-24">
        {data && data.blocks.length > 0 ? (
          <BlockRenderer blocks={data.blocks} photos={photoMap} />
        ) : (
          <div className="mx-auto max-w-md rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
            <p className="font-serif text-2xl">Zatím tu nejsou žádné novinky.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Vraťte se prosím později.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
