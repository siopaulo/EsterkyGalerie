import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CloudinaryImage } from "@/components/shared/cloudinary-image";
import { Badge } from "@/components/ui/badge";
import { BlockRenderer } from "@/features/blocks/render";
import { collectPhotoIds } from "@/features/blocks/collect-ids";
import { fetchStoryBySlug, fetchRelatedStories } from "@/features/stories/queries";
import { fetchPhotosByIds } from "@/features/photos/queries";
import { buildMetadata, jsonLd } from "@/lib/seo";
import { getSiteSettings } from "@/features/site-settings/queries";
import { formatDateCs } from "@/lib/utils";
import { cldUrlOrNull } from "@/lib/cloudinary-url";

export const revalidate = 120;

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const [data, settings] = await Promise.all([fetchStoryBySlug(slug), getSiteSettings()]);
  if (!data) return buildMetadata({ title: "Příběh nenalezen", noIndex: true, titleIsAbsolute: true });
  const ogImage = cldUrlOrNull(data.cover?.cloudinary_public_id, {
    width: 1200,
    height: 630,
    crop: "fill",
    gravity: "auto",
  });
  return buildMetadata({
    title: data.story.seo_title || data.story.title,
    description: data.story.seo_description || data.story.excerpt,
    path: `/pribehy/${data.story.slug}`,
    type: "article",
    image: ogImage,
    useTitleTemplate: true,
    siteName: settings.site_name,
  });
}

export default async function StoryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await fetchStoryBySlug(slug);
  if (!data) notFound();

  const coverId = data.story.cover_photo_id;
  const blockPhotoIds = collectPhotoIds(data.blocks);
  const allIds = Array.from(new Set([...(coverId ? [coverId] : []), ...blockPhotoIds]));
  const photos = await fetchPhotosByIds(allIds);
  const photoMap = new Map(photos.map((p) => [p.id, p]));

  const related = await fetchRelatedStories(
    data.story.id,
    data.tags.map((t) => t.id),
    3,
  );

  return (
    <article>
      <header className="container-site pt-14 pb-10 md:pt-20 md:pb-14">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-foreground">Domů</Link></li>
            <li>›</li>
            <li><Link href="/pribehy" className="hover:text-foreground">Příběhy</Link></li>
            <li>›</li>
            <li className="text-foreground">{data.story.title}</li>
          </ol>
        </nav>

        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {formatDateCs(data.story.published_at)}
        </p>
        <h1 className="mt-3 max-w-4xl font-serif text-4xl leading-tight md:text-6xl">
          {data.story.title}
        </h1>
        {data.story.excerpt ? (
          <p className="mt-5 max-w-2xl whitespace-pre-line text-lg text-muted-foreground">{data.story.excerpt}</p>
        ) : null}
        {data.tags.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {data.tags.map((t) => (
              <Link key={t.id} href={`/pribehy?tag=${t.slug}`}>
                <Badge variant="outline">{t.name}</Badge>
              </Link>
            ))}
          </div>
        ) : null}
      </header>

      {data.cover ? (
        <div className="container-site">
          <div className="overflow-hidden rounded-md">
            <CloudinaryImage
              publicId={data.cover.cloudinary_public_id}
              alt={data.cover.alt_text || data.story.title}
              aspectClass="aspect-[16/9]"
              variant={{ crop: "fill", gravity: "auto" }}
              priority
              sizes="100vw"
            />
          </div>
        </div>
      ) : null}

      <section className="container-site py-16 md:py-20">
        {data.blocks.length > 0 ? (
          <BlockRenderer blocks={data.blocks} photos={photoMap} />
        ) : (
          <div className="mx-auto max-w-2xl prose-editorial text-center text-muted-foreground">
            <p>Příběh se brzy dočká obsahu.</p>
          </div>
        )}
      </section>

      {related.length > 0 ? (
        <section className="container-site pb-24">
          <h2 className="font-serif text-2xl md:text-3xl">Mohlo by vás zajímat</h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((s) => (
              <li key={s.id}>
                <Link href={`/pribehy/${s.slug}`} className="group block">
                  <div className="overflow-hidden rounded-md bg-muted">
                    <CloudinaryImage
                      publicId={s.cover_photo?.cloudinary_public_id}
                      alt={s.cover_photo?.alt_text || s.title}
                      aspectClass="aspect-[4/3]"
                      variant={{ crop: "fill", gravity: "auto" }}
                    />
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
                    {formatDateCs(s.published_at)}
                  </p>
                  <p className="mt-1 font-serif text-xl group-hover:text-accent">{s.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({
          "@type": "Article",
          headline: data.story.title,
          datePublished: data.story.published_at,
          dateModified: data.story.updated_at,
          description: data.story.seo_description ?? data.story.excerpt ?? undefined,
          inLanguage: "cs-CZ",
        })}
      />
    </article>
  );
}
