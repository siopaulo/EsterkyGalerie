import type { Metadata } from "next";
import { SearchInput } from "@/components/public/search-input";
import { TagFilter } from "@/components/public/tag-filter";
import { Pagination } from "@/components/public/pagination";
import { PhotoGridWithLightbox } from "@/components/public/photo-grid";
import { fetchGallery, fetchAllTags } from "@/features/photos/queries";
import { buildMetadata } from "@/lib/seo";
import { safeNumber } from "@/lib/utils";
import { PAGINATION } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({
  title: "Galerie",
  useTitleTemplate: true,
  description: "Kompletní galerie fotografií – koně, portréty, příroda.",
  path: "/galerie",
});

export const revalidate = 60;

type SP = Promise<{ [k: string]: string | string[] | undefined }>;

export default async function GaleriePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const page = safeNumber(sp.page, 1);
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const tagSlugs = normalizeArray(sp.tag);

  const [result, tags] = await Promise.all([
    fetchGallery({ page, perPage: PAGINATION.gallery, search: q, tagSlugs }),
    fetchAllTags(),
  ]);

  return (
    <>
      <header className="container-site py-14 md:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Galerie
        </p>
        <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-tight md:text-6xl">
          Archiv fotografií
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Všechny veřejné fotky.
        </p>
      </header>

      <section className="container-site pb-8 space-y-6">
        <SearchInput placeholder="Hledat ve fotografiích…" />
        <TagFilter tags={tags} />
        <p className="text-sm text-muted-foreground">
          {result.total === 0
            ? "Žádné fotografie"
            : `${result.total} ${pluralCs(result.total, "fotografie", "fotografie", "fotografií")}`}
        </p>
      </section>

      <section className="container-site pb-16">
        {result.photos.length === 0 ? (
          <div className="mx-auto max-w-md rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
            <p className="font-serif text-2xl">Nic jsem nenašla</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Zkuste jiný filtr nebo výraz.
            </p>
          </div>
        ) : (
          <PhotoGridWithLightbox photos={result.photos} />
        )}
      </section>

      {result.totalPages > 1 ? (
        <section className="container-site pb-24">
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            baseQuery={sp}
            basePath="/galerie"
          />
        </section>
      ) : null}
    </>
  );
}

function normalizeArray(v: string | string[] | undefined): string[] | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v.filter(Boolean) : [v];
}

function pluralCs(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}
