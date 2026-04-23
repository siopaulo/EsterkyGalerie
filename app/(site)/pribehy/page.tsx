import type { Metadata } from "next";
import Link from "next/link";
import { CloudinaryImage } from "@/components/shared/cloudinary-image";
import { SearchInput } from "@/components/public/search-input";
import { TagFilter } from "@/components/public/tag-filter";
import { Pagination } from "@/components/public/pagination";
import { fetchStories } from "@/features/stories/queries";
import { fetchAllTags } from "@/features/photos/queries";
import { buildMetadata } from "@/lib/seo";
import { formatDateCs, safeNumber } from "@/lib/utils";
import { PAGINATION } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({
  title: "Příběhy",
  useTitleTemplate: true,
  description: "Fotografické příběhy z focení – koně, portréty, momenty.",
  path: "/pribehy",
});

export const revalidate = 60;

type SP = Promise<{ [k: string]: string | string[] | undefined }>;

export default async function StoriesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const page = safeNumber(sp.page, 1);
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const tagSlugs = normalizeArray(sp.tag);

  const [result, tags] = await Promise.all([
    fetchStories({ page, perPage: PAGINATION.stories, search: q, tagSlugs }),
    fetchAllTags(),
  ]);

  return (
    <>
      <header className="container-site py-14 md:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Příběhy
        </p>
        <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-tight md:text-6xl">
          Co zůstalo za objektivem
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Krátké reportáže, úvahy a výběry z focení.
        </p>
      </header>

      <section className="container-site pb-8 space-y-6">
        <SearchInput placeholder="Hledat v příbězích…" />
        <TagFilter tags={tags} />
      </section>

      <section className="container-site pb-16">
        {result.stories.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {result.stories.map((s) => (
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
                  <h2 className="mt-1 font-serif text-2xl leading-tight group-hover:text-accent">
                    {s.title}
                  </h2>
                  {s.excerpt ? (
                    <p className="mt-2 line-clamp-3 text-muted-foreground">{s.excerpt}</p>
                  ) : null}
                  {s.tags.length > 0 ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {s.tags.slice(0, 3).map((t) => t.name).join(" · ")}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {result.totalPages > 1 ? (
        <section className="container-site pb-24">
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            baseQuery={sp}
            basePath="/pribehy"
          />
        </section>
      ) : null}
    </>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
      <p className="font-serif text-2xl">Zatím tu nic není</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Zkuste zmenšit filtr nebo vyhledat jinak.
      </p>
    </div>
  );
}

function normalizeArray(v: string | string[] | undefined): string[] | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v.filter(Boolean) : [v];
}
