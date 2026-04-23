import Link from "next/link";
import type { Photo, StoryWithMeta } from "@/types/database";
import { CloudinaryImage } from "@/components/shared/cloudinary-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateCs } from "@/lib/utils";
import { sanitizeHtml } from "@/features/blocks/sanitize";
import { log } from "@/lib/logger";
import { HomeHeroCarousel } from "@/components/public/home-hero-carousel";
import { GalleryShowcase } from "@/components/public/gallery-showcase";
import {
  type BlockType,
  type HeroPayload,
  type RichTextPayload,
  type SectionHeadingPayload,
  type SingleImagePayload,
  type ImagePairPayload,
  type ImageCarouselPayload,
  type PhotoGridPayload,
  type QuotePayload,
  type CtaPayload,
  type FaqPayload,
  type FeaturedPhotosPayload,
  type StoryIntroPayload,
  type HomeHeroPayload,
  type HomeAboutPayload,
  type HomeGalleryCarouselPayload,
  type HomeServiceCtaPayload,
  type HomeStoriesFeedPayload,
  parseBlockPayload,
} from "@/features/blocks/schemas";

export type RenderableBlock = {
  id: string;
  block_type: string;
  sort_order: number;
  payload: unknown;
};

/**
 * Dodatečný kontext pro bloky, které potřebují data mimo vlastní payload:
 *  - `stories`            – pro `home_stories_feed`
 *  - `featuredPhotos`     – fallback pro `home_hero` / `home_gallery_carousel`,
 *                           pokud admin nevybral konkrétní fotky
 */
export interface BlockRenderContext {
  stories?: StoryWithMeta[];
  featuredPhotos?: Photo[];
  /** Jaký container použít pro full-width home bloky. */
  layout?: "default" | "home";
}

interface BlockRendererProps {
  blocks: RenderableBlock[];
  photos: Map<string, Photo>;
  context?: BlockRenderContext;
}

export function BlockRenderer({ blocks, photos, context }: BlockRendererProps) {
  const isHome = context?.layout === "home";
  return (
    <div className={cn("flex flex-col", isHome ? "gap-20 md:gap-28" : "gap-16 md:gap-20")}>
      {blocks.map((b) => {
        const parsed = parseBlockPayload(b.block_type, b.payload);
        if (!parsed.ok) {
          // Defenzivní – nerozbijeme stránku, jen vynecháme blok a zalogujeme.
          if (typeof window === "undefined") {
            log("warn", "blocks: invalid payload skipped", {
              blockType: b.block_type,
              blockId: b.id,
              detail: parsed.error,
            });
          }
          return null;
        }
        return (
          <div key={b.id} className="fade-in">
            {renderByType(parsed.type, parsed.data, photos, context)}
          </div>
        );
      })}
    </div>
  );
}

function renderByType(
  type: BlockType,
  data: unknown,
  photos: Map<string, Photo>,
  context?: BlockRenderContext,
) {
  switch (type) {
    case "hero":
      return <HeroBlock data={data as HeroPayload} photos={photos} />;
    case "rich_text":
      return <RichTextBlock data={data as RichTextPayload} />;
    case "section_heading":
      return <SectionHeadingBlock data={data as SectionHeadingPayload} />;
    case "single_image":
      return <SingleImageBlock data={data as SingleImagePayload} photos={photos} />;
    case "image_pair":
      return <ImagePairBlock data={data as ImagePairPayload} photos={photos} />;
    case "image_carousel":
      return <ImageCarouselBlock data={data as ImageCarouselPayload} photos={photos} />;
    case "photo_grid":
      return <PhotoGridBlock data={data as PhotoGridPayload} photos={photos} />;
    case "quote":
      return <QuoteBlock data={data as QuotePayload} />;
    case "cta":
      return <CtaBlock data={data as CtaPayload} />;
    case "faq":
      return <FaqBlock data={data as FaqPayload} />;
    case "featured_photos":
      return <FeaturedPhotosBlock data={data as FeaturedPhotosPayload} photos={photos} />;
    case "story_intro":
      return <StoryIntroBlock data={data as StoryIntroPayload} photos={photos} />;
    case "home_hero":
      return <HomeHeroBlock data={data as HomeHeroPayload} photos={photos} context={context} />;
    case "home_about":
      return <HomeAboutBlock data={data as HomeAboutPayload} />;
    case "home_gallery_carousel":
      return (
        <HomeGalleryCarouselBlock
          data={data as HomeGalleryCarouselPayload}
          photos={photos}
          context={context}
        />
      );
    case "home_service_cta":
      return <HomeServiceCtaBlock data={data as HomeServiceCtaPayload} />;
    case "home_stories_feed":
      return <HomeStoriesFeedBlock data={data as HomeStoriesFeedPayload} context={context} />;
    default:
      return null;
  }
}

// ---------- individual blocks ----------

function HeroBlock({ data, photos }: { data: HeroPayload; photos: Map<string, Photo> }) {
  const bg = data.background_photo_id ? photos.get(data.background_photo_id) : null;
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-xl",
        bg ? "min-h-[60vh] bg-muted" : "border border-border bg-muted/40",
      )}
    >
      {bg ? (
        <>
          <CloudinaryImage
            publicId={bg.cloudinary_public_id}
            alt={bg.alt_text || data.title}
            aspectClass="absolute inset-0"
            priority
            sizes="100vw"
            variant={{ crop: "fill", gravity: "auto" }}
            className="absolute inset-0 h-full w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/60" />
        </>
      ) : null}
      <div
        className={cn(
          "relative z-10 flex min-h-[40vh] flex-col justify-end gap-5 p-8 md:p-14",
          bg ? "text-white" : "text-foreground",
          data.align === "center" && "items-center text-center",
        )}
      >
        <h1 className={cn("max-w-3xl font-serif text-4xl leading-tight md:text-6xl", bg ? "" : "")}>
          {data.title}
        </h1>
        {data.subtitle ? (
          <p className={cn("max-w-xl text-base md:text-lg", bg ? "text-white/90" : "text-muted-foreground")}>
            {data.subtitle}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          {data.cta_primary ? (
            <Button asChild size="lg" variant="primary">
              <Link href={data.cta_primary.href}>{data.cta_primary.label}</Link>
            </Button>
          ) : null}
          {data.cta_secondary ? (
            <Button asChild size="lg" variant={bg ? "outline" : "ghost"} className={bg ? "border-white/60 bg-transparent text-white hover:bg-white/10" : ""}>
              <Link href={data.cta_secondary.href}>{data.cta_secondary.label}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function RichTextBlock({ data }: { data: RichTextPayload }) {
  const html = sanitizeHtml(data.html);
  return (
    <div className="mx-auto max-w-2xl prose-editorial" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

function SectionHeadingBlock({ data }: { data: SectionHeadingPayload }) {
  return (
    <div
      className={cn(
        "mx-auto max-w-3xl",
        data.align === "center" && "text-center",
      )}
    >
      {data.eyebrow ? (
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-accent">
          {data.eyebrow}
        </p>
      ) : null}
      <h2 className="font-serif text-3xl md:text-4xl">{data.title}</h2>
      {data.description ? (
        <p className="mt-3 text-base text-muted-foreground md:text-lg">{data.description}</p>
      ) : null}
    </div>
  );
}

function SingleImageBlock({ data, photos }: { data: SingleImagePayload; photos: Map<string, Photo> }) {
  const p = photos.get(data.photo_id);
  const aspect =
    data.aspect === "portrait"
      ? "aspect-[3/4]"
      : data.aspect === "landscape"
        ? "aspect-[16/10]"
        : data.aspect === "square"
          ? "aspect-square"
          : undefined;
  return (
    <figure className="mx-auto max-w-4xl">
      <CloudinaryImage
        publicId={p?.cloudinary_public_id}
        alt={p?.alt_text || data.caption || ""}
        aspectClass={aspect}
        variant={{ crop: "fill", gravity: "auto" }}
        className="overflow-hidden rounded-md"
      />
      {data.caption ? (
        <figcaption className="mt-3 text-center text-sm italic text-muted-foreground">
          {data.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function ImagePairBlock({ data, photos }: { data: ImagePairPayload; photos: Map<string, Photo> }) {
  const left = photos.get(data.left_photo_id);
  const right = photos.get(data.right_photo_id);
  return (
    <figure className="mx-auto max-w-5xl">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <CloudinaryImage
          publicId={left?.cloudinary_public_id}
          alt={left?.alt_text || ""}
          aspectClass="aspect-[3/4]"
          variant={{ crop: "fill", gravity: "auto" }}
          className="overflow-hidden rounded-md"
        />
        <CloudinaryImage
          publicId={right?.cloudinary_public_id}
          alt={right?.alt_text || ""}
          aspectClass="aspect-[3/4]"
          variant={{ crop: "fill", gravity: "auto" }}
          className="overflow-hidden rounded-md"
        />
      </div>
      {data.caption ? (
        <figcaption className="mt-3 text-center text-sm italic text-muted-foreground">
          {data.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function ImageCarouselBlock({ data, photos }: { data: ImageCarouselPayload; photos: Map<string, Photo> }) {
  // SSR-friendly horizontální scroll galerie (snap). Žádný JS potřeba.
  const items = data.photo_ids
    .map((id) => photos.get(id))
    .filter((p): p is Photo => Boolean(p));
  if (!items.length) return null;
  return (
    <figure className="mx-auto max-w-6xl">
      <div className="-mx-4 overflow-x-auto pb-3 [scrollbar-width:thin] sm:mx-0 snap-x snap-mandatory">
        <div className="flex gap-3 px-4 sm:px-0 sm:gap-4">
          {items.map((p) => (
            <div
              key={p.id}
              className="snap-start shrink-0 w-[80%] sm:w-[52%] md:w-[44%] lg:w-[36%]"
            >
              <CloudinaryImage
                publicId={p.cloudinary_public_id}
                alt={p.alt_text || p.display_name}
                aspectClass="aspect-[3/4]"
                variant={{ crop: "fill", gravity: "auto" }}
                className="overflow-hidden rounded-md"
              />
            </div>
          ))}
        </div>
      </div>
      {data.caption ? (
        <figcaption className="mt-3 text-center text-sm italic text-muted-foreground">
          {data.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function PhotoGridBlock({ data, photos }: { data: PhotoGridPayload; photos: Map<string, Photo> }) {
  const items = data.photo_ids
    .map((id) => photos.get(id))
    .filter((p): p is Photo => Boolean(p));
  if (!items.length) return null;
  const cols =
    data.columns === 2 ? "sm:grid-cols-2" : data.columns === 4 ? "sm:grid-cols-3 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <ul className={cn("mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:gap-4", cols)}>
      {items.map((p) => (
        <li key={p.id} className="overflow-hidden rounded-md bg-muted">
          <CloudinaryImage
            publicId={p.cloudinary_public_id}
            alt={p.alt_text || p.display_name}
            aspectClass="aspect-[4/5]"
            variant={{ crop: "fill", gravity: "auto" }}
          />
        </li>
      ))}
    </ul>
  );
}

function QuoteBlock({ data }: { data: QuotePayload }) {
  return (
    <figure className="mx-auto max-w-2xl border-l-2 border-accent pl-6">
      <blockquote className="font-serif text-2xl leading-snug text-foreground md:text-3xl">
        „{data.quote}“
      </blockquote>
      {(data.author || data.context) && (
        <figcaption className="mt-4 text-sm text-muted-foreground">
          {data.author ? <span className="font-medium text-foreground">{data.author}</span> : null}
          {data.author && data.context ? <span> · </span> : null}
          {data.context ? <span>{data.context}</span> : null}
        </figcaption>
      )}
    </figure>
  );
}

function CtaBlock({ data }: { data: CtaPayload }) {
  return (
    <section className="mx-auto max-w-4xl rounded-xl border border-border bg-muted/40 p-10 text-center">
      <h2 className="font-serif text-3xl md:text-4xl">{data.title}</h2>
      {data.description ? (
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{data.description}</p>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg" variant="primary">
          <Link href={data.primary.href}>{data.primary.label}</Link>
        </Button>
        {data.secondary ? (
          <Button asChild size="lg" variant="outline">
            <Link href={data.secondary.href}>{data.secondary.label}</Link>
          </Button>
        ) : null}
      </div>
    </section>
  );
}

function FaqBlock({ data }: { data: FaqPayload }) {
  return (
    <div className="mx-auto max-w-3xl">
      <dl className="divide-y divide-border border-t border-b border-border">
        {data.items.map((item, i) => (
          <details key={i} className="group py-5">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left">
              <dt className="font-serif text-xl text-foreground">{item.question}</dt>
              <span className="mt-1 text-muted-foreground transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <dd className="mt-3 text-base leading-relaxed text-muted-foreground">{item.answer}</dd>
          </details>
        ))}
      </dl>
    </div>
  );
}

function FeaturedPhotosBlock({ data, photos }: { data: FeaturedPhotosPayload; photos: Map<string, Photo> }) {
  const items = data.photo_ids.map((id) => photos.get(id)).filter((p): p is Photo => Boolean(p));
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-6xl">
      {(data.title || data.description) && (
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            {data.title ? <h2 className="font-serif text-3xl md:text-4xl">{data.title}</h2> : null}
            {data.description ? (
              <p className="mt-2 max-w-lg text-muted-foreground">{data.description}</p>
            ) : null}
          </div>
          {data.view_all_href ? (
            <Link
              href={data.view_all_href}
              className="whitespace-nowrap text-sm text-foreground underline underline-offset-4 hover:text-accent"
            >
              Celá galerie →
            </Link>
          ) : null}
        </div>
      )}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {items.slice(0, 6).map((p) => (
          <li key={p.id} className="overflow-hidden rounded-md bg-muted">
            <CloudinaryImage
              publicId={p.cloudinary_public_id}
              alt={p.alt_text || p.display_name}
              aspectClass="aspect-[4/5]"
              variant={{ crop: "fill", gravity: "auto" }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function StoryIntroBlock({ data, photos }: { data: StoryIntroPayload; photos: Map<string, Photo> }) {
  const cover = data.cover_photo_id ? photos.get(data.cover_photo_id) : null;
  return (
    <header className="mx-auto max-w-4xl text-center">
      {data.date ? (
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {formatDateCs(data.date)}
        </p>
      ) : null}
      <h1 className="font-serif text-4xl md:text-6xl">{data.title}</h1>
      {data.subtitle ? (
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{data.subtitle}</p>
      ) : null}
      {cover ? (
        <div className="mt-10 overflow-hidden rounded-md">
          <CloudinaryImage
            publicId={cover.cloudinary_public_id}
            alt={cover.alt_text || data.title}
            aspectClass="aspect-[16/9]"
            variant={{ crop: "fill", gravity: "auto" }}
            priority
            sizes="100vw"
          />
        </div>
      ) : null}
    </header>
  );
}

// ---------- home blocks ----------

/**
 * Vybere fotky pro home block – preferuje explicitní payload.photo_ids,
 * při prázdném fallbackuje na `featuredPhotos` z kontextu (= settings).
 */
function resolveHomePhotos(
  photoIds: string[] | undefined,
  photos: Map<string, Photo>,
  context: BlockRenderContext | undefined,
): Photo[] {
  if (photoIds && photoIds.length > 0) {
    return photoIds
      .map((id) => photos.get(id))
      .filter((p): p is Photo => Boolean(p));
  }
  return context?.featuredPhotos ?? [];
}

function HomeHeroBlock({
  data,
  photos,
  context,
}: {
  data: HomeHeroPayload;
  photos: Map<string, Photo>;
  context?: BlockRenderContext;
}) {
  const carousel = resolveHomePhotos(data.photo_ids, photos, context);
  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      <div className="container-site grid min-h-[78vh] gap-10 py-14 md:grid-cols-[1.1fr_1fr] md:items-center md:gap-16 md:py-24">
        <div>
          {data.eyebrow ? (
            <Badge variant="outline" className="mb-5 bg-background">
              {data.eyebrow}
            </Badge>
          ) : null}
          <h1 className="font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl">
            {data.title}
          </h1>
          {data.subtitle ? (
            <p className="mt-6 max-w-lg text-lg text-muted-foreground md:text-xl">
              {data.subtitle}
            </p>
          ) : null}
          {(data.cta_primary || data.cta_secondary) && (
            <div className="mt-8 flex flex-wrap gap-3">
              {data.cta_primary ? (
                <Button asChild size="lg" variant="primary">
                  <Link href={data.cta_primary.href}>{data.cta_primary.label}</Link>
                </Button>
              ) : null}
              {data.cta_secondary ? (
                <Button asChild size="lg" variant="outline">
                  <Link href={data.cta_secondary.href}>{data.cta_secondary.label}</Link>
                </Button>
              ) : null}
            </div>
          )}
        </div>
        {carousel.length > 0 ? (
          <HomeHeroCarousel photos={carousel} autoPlayMs={data.auto_rotate_ms ?? 5000} />
        ) : null}
      </div>
    </section>
  );
}

function HomeAboutBlock({ data }: { data: HomeAboutPayload }) {
  return (
    <section className="container-site">
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[1fr_1.2fr] md:gap-16">
        <div>
          {data.eyebrow ? (
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {data.eyebrow}
            </p>
          ) : null}
          <h2 className="mt-3 font-serif text-4xl md:text-5xl">{data.title}</h2>
        </div>
        <div className="text-lg leading-relaxed text-foreground/80">
          {data.paragraphs.map((p, i) => (
            <p key={i} className={i > 0 ? "mt-4" : undefined}>
              {p}
            </p>
          ))}
          {data.link_label && data.link_href ? (
            <Link
              href={data.link_href}
              className="mt-6 inline-block text-foreground underline underline-offset-4 hover:text-accent"
            >
              {data.link_label} →
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function HomeGalleryCarouselBlock({
  data,
  photos,
  context,
}: {
  data: HomeGalleryCarouselPayload;
  photos: Map<string, Photo>;
  context?: BlockRenderContext;
}) {
  const items = data.use_featured
    ? context?.featuredPhotos ?? []
    : (data.photo_ids ?? [])
        .map((id) => photos.get(id))
        .filter((p): p is Photo => Boolean(p));
  if (items.length === 0) return null;
  const hasHeader = data.eyebrow || data.title || data.view_all_label;
  return (
    <section className="container-site">
      {hasHeader ? (
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            {data.eyebrow ? (
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {data.eyebrow}
              </p>
            ) : null}
            {data.title ? (
              <h2 className="mt-2 font-serif text-3xl md:text-4xl">{data.title}</h2>
            ) : null}
          </div>
          {data.view_all_label ? (
            <Link
              href={data.view_all_href || "/galerie"}
              className="whitespace-nowrap text-sm text-foreground underline underline-offset-4 hover:text-accent"
            >
              {data.view_all_label} →
            </Link>
          ) : null}
        </div>
      ) : null}
      <GalleryShowcase
        photos={items}
        autoPlayMs={data.auto_rotate_ms ?? 5000}
        layout={data.layout ?? "editorial"}
      />
    </section>
  );
}

function HomeServiceCtaBlock({ data }: { data: HomeServiceCtaPayload }) {
  return (
    <section
      className={cn(
        "border-y border-border",
        data.background === "muted" ? "bg-muted/30" : "bg-background",
      )}
    >
      <div className="container-site py-20 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          {data.eyebrow ? (
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {data.eyebrow}
            </p>
          ) : null}
          <h2 className="mt-3 font-serif text-4xl md:text-5xl">{data.title}</h2>
          {data.description ? (
            <p className="mt-5 text-lg text-muted-foreground">{data.description}</p>
          ) : null}
          {(data.cta_primary || data.cta_secondary) && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {data.cta_primary ? (
                <Button asChild size="lg" variant="primary">
                  <Link href={data.cta_primary.href}>{data.cta_primary.label}</Link>
                </Button>
              ) : null}
              {data.cta_secondary ? (
                <Button asChild size="lg" variant="outline">
                  <Link href={data.cta_secondary.href}>{data.cta_secondary.label}</Link>
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function HomeStoriesFeedBlock({
  data,
  context,
}: {
  data: HomeStoriesFeedPayload;
  context?: BlockRenderContext;
}) {
  const stories = (context?.stories ?? []).slice(0, data.count ?? 3);
  if (stories.length === 0) return null;
  return (
    <section className="container-site">
      <div className="mb-10 flex items-end justify-between gap-6">
        <div>
          {data.eyebrow ? (
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {data.eyebrow}
            </p>
          ) : null}
          {data.title ? (
            <h2 className="mt-2 font-serif text-3xl md:text-4xl">{data.title}</h2>
          ) : null}
        </div>
        {data.view_all_label ? (
          <Link
            href={data.view_all_href || "/pribehy"}
            className="text-sm underline underline-offset-4 hover:text-accent"
          >
            {data.view_all_label} →
          </Link>
        ) : null}
      </div>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stories.map((s) => (
          <li key={s.id}>
            <Link href={`/pribehy/${s.slug}`} className="group block">
              <div className="overflow-hidden rounded-md bg-muted">
                <CloudinaryImage
                  publicId={s.cover_photo?.cloudinary_public_id}
                  alt={s.cover_photo?.alt_text || s.title}
                  aspectClass="aspect-[4/3]"
                  variant={{ crop: "fill", gravity: "auto" }}
                  className="transition-transform duration-700 group-hover:scale-[1.02]"
                />
              </div>
              <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">
                {formatDateCs(s.published_at)}
              </p>
              <h3 className="mt-1 font-serif text-2xl leading-tight group-hover:text-accent">
                {s.title}
              </h3>
              {s.excerpt ? (
                <p className="mt-2 line-clamp-2 text-muted-foreground">{s.excerpt}</p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
