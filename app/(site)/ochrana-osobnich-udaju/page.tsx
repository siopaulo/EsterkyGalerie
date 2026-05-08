import type { Metadata } from "next";
import { fetchPageBySlug } from "@/features/pages/queries";
import { BlockRenderer } from "@/features/blocks/render";
import { collectPhotoIds } from "@/features/blocks/collect-ids";
import { fetchPhotosByIds } from "@/features/photos/queries";
import { metadataForCmsPage } from "@/lib/seo";
import { getSiteSettings } from "@/features/site-settings/queries";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const [data, settings] = await Promise.all([fetchPageBySlug("ochrana-osobnich-udaju"), getSiteSettings()]);
  return metadataForCmsPage({
    page: data?.page,
    path: "/ochrana-osobnich-udaju",
    fallbackTitle: "Ochrana osobních údajů",
    siteName: settings.site_name,
  });
}

export default async function GdprPage() {
  const data = await fetchPageBySlug("ochrana-osobnich-udaju");
  const photoIds = data ? collectPhotoIds(data.blocks) : [];
  const photos = photoIds.length ? await fetchPhotosByIds(photoIds) : [];
  const photoMap = new Map(photos.map((p) => [p.id, p]));

  return (
    <article className="container-site py-14 md:py-20">
      <h1 className="font-serif text-4xl md:text-5xl">
        {data?.page.title ?? "Ochrana osobních údajů"}
      </h1>
      {data?.page.intro ? (
        <p className="mt-4 max-w-2xl whitespace-pre-line text-lg text-muted-foreground">{data.page.intro}</p>
      ) : null}

      {data && data.blocks.length > 0 ? (
        <div className="mx-auto mt-10 max-w-2xl prose-editorial">
          <BlockRenderer blocks={data.blocks} photos={photoMap} />
        </div>
      ) : null}
    </article>
  );
}
