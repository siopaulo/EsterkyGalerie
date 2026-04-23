import type { Metadata } from "next";
import { fetchPageBySlug } from "@/features/pages/queries";
import { BlockRenderer } from "@/features/blocks/render";
import { collectPhotoIds } from "@/features/blocks/collect-ids";
import { fetchPhotosByIds } from "@/features/photos/queries";
import { buildMetadata, metadataForCmsPage } from "@/lib/seo";
import { getSiteSettings } from "@/features/site-settings/queries";
import { notFound } from "next/navigation";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const [data, settings] = await Promise.all([fetchPageBySlug("o-mne"), getSiteSettings()]);
  if (!data) {
    return buildMetadata({
      title: "O mně",
      path: "/o-mne",
      useTitleTemplate: true,
      siteName: settings.site_name,
    });
  }
  return metadataForCmsPage({
    page: data.page,
    path: "/o-mne",
    fallbackTitle: "O mně",
    siteName: settings.site_name,
  });
}

export default async function OMnePage() {
  const data = await fetchPageBySlug("o-mne");
  if (!data) notFound();

  const photoIds = collectPhotoIds(data.blocks);
  const photos = await fetchPhotosByIds(photoIds);
  const photoMap = new Map(photos.map((p) => [p.id, p]));

  return (
    <>
      <header className="container-site py-14 md:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          O autorce
        </p>
        <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-tight md:text-6xl">
          {data.page.title}
        </h1>
        {data.page.intro ? (
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{data.page.intro}</p>
        ) : null}
      </header>

      <section className="container-site pb-24">
        {data.blocks.length > 0 ? (
          <BlockRenderer blocks={data.blocks} photos={photoMap} />
        ) : (
          <div className="mx-auto max-w-2xl prose-editorial">
            <p>
              Jmenuji se Esterka a fotografuji, co nejde slovy. Objektiv používám tam, kde slova
              nestačí – mezi koňmi, jezdci a přírodou.
            </p>
            <p>
              Fotím pomalu, pozorně a rozhodně. Miluji světlo nad ránem, klidný pohled a moment,
              který ukazuje, kdo jsme – my lidé i ta zvířata vedle nás.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
