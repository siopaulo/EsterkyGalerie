import type { Metadata } from "next";
import Script from "next/script";
import { ReviewForm } from "@/components/public/review-form";
import { StarRating } from "@/components/public/star-rating";
import { Pagination } from "@/components/public/pagination";
import {
  getReviewsSummary,
  listApprovedReviews,
  type PublicReviewsSort,
  type ReviewsSummary,
} from "@/features/reviews/queries";
import { ReviewsSort } from "@/components/public/reviews-sort";
import { buildMetadata, jsonLd } from "@/lib/seo";
import { formatDateCs, safeNumber } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Reference",
  description:
    "Ohlasy klientů z focení koní, portrétů a životních okamžiků. Přečti si zkušenosti ostatních a podělte se o tu svoji.",
  path: "/reference",
});

export const revalidate = 120;

interface ReferencePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const PAGE_SIZE = 10;

const ALLOWED_SORTS: ReadonlyArray<PublicReviewsSort> = [
  "newest",
  "oldest",
  "best",
  "worst",
];

export default async function ReferencePage({ searchParams }: ReferencePageProps) {
  const params = await searchParams;
  const page = Math.max(1, safeNumber(params.page, 1));
  const sortParam = typeof params.sort === "string" ? params.sort : undefined;
  const sort: PublicReviewsSort = ALLOWED_SORTS.includes(sortParam as PublicReviewsSort)
    ? (sortParam as PublicReviewsSort)
    : "newest";

  const [summary, list] = await Promise.all([
    getReviewsSummary(),
    listApprovedReviews({ page, pageSize: PAGE_SIZE, sort }),
  ]);

  const structured = summary.count > 0 && summary.average !== null
    ? jsonLd({
        "@type": "Organization",
        name: "Esterky Fotky",
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: summary.average,
          reviewCount: summary.count,
          bestRating: 5,
          worstRating: 1,
        },
      })
    : null;

  return (
    <>
      {structured ? (
        <Script
          id="reviews-aggregate-rating"
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={structured}
        />
      ) : null}

      <header className="container-site py-14 md:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Reference
        </p>
        <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-tight md:text-6xl">
          Co říkají klienti
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Upřímné ohlasy z focení – bez filtrů, bez úprav. Přidej i tu svou,
          pomůžeš tím dalším, kdo zvažují, jestli jít do toho.
        </p>
      </header>

      {summary.count > 0 && summary.average !== null ? (
        <section className="container-site pb-8">
          <div className="flex flex-col gap-6 rounded-xl border border-border bg-muted/30 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex items-center gap-5">
              <div>
                <p className="font-serif text-5xl leading-none md:text-6xl">
                  {summary.average.toFixed(1)}
                </p>
                <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                  Průměrné hodnocení
                </p>
              </div>
              <div className="h-16 w-px bg-border" aria-hidden />
              <div>
                <StarRating value={Math.round(summary.average)} size={22} />
                <p className="mt-2 text-sm text-muted-foreground">
                  {summary.count}{" "}
                  {pluralReviewsCs(summary.count)}
                </p>
              </div>
            </div>
            <DistributionBars summary={summary} />
          </div>
        </section>
      ) : null}

      <section className="container-site pb-24 grid gap-12 md:grid-cols-[1.4fr_1fr]">
        <div className="order-2 md:order-1">
          {list.rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-10 text-center">
              <p className="font-serif text-2xl">Zatím žádné schválené recenze</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Buď první – přidej svou zkušenost vpravo. Díky!
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {list.total}{" "}
                  {pluralReviewsCs(list.total)}
                </p>
                <ReviewsSort value={sort} />
              </div>
              <ul className="space-y-5">
                {list.rows.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-lg border border-border bg-background p-6 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-serif text-base">
                          {initialOf(r.name)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {r.name?.trim() ? r.name : "Anonym"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateCs(r.created_at)}
                          </p>
                        </div>
                      </div>
                      <StarRating value={r.rating} size={18} />
                    </div>
                    {r.message?.trim() ? (
                      <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-foreground/90">
                        {r.message}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Pagination
                  page={list.page}
                  totalPages={list.totalPages}
                  basePath="/reference"
                  baseQuery={params}
                />
              </div>
            </>
          )}
        </div>

        <aside className="order-1 md:order-2">
          <div className="md:sticky md:top-24">
            <ReviewForm />
          </div>
        </aside>
      </section>
    </>
  );
}

function pluralReviewsCs(n: number): string {
  if (n === 1) return "recenze";
  if (n >= 2 && n <= 4) return "recenze";
  return "recenzí";
}

function initialOf(name: string | null): string {
  const trimmed = name?.trim();
  if (!trimmed) return "?";
  const first = trimmed[0];
  return first ? first.toUpperCase() : "?";
}

function DistributionBars({ summary }: { summary: ReviewsSummary }) {
  const max = Math.max(...Object.values(summary.distribution), 1);
  return (
    <div className="w-full max-w-xs space-y-1.5">
      {([5, 4, 3, 2, 1] as const).map((n) => {
        const val = summary.distribution[n];
        const pct = (val / max) * 100;
        return (
          <div key={n} className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="w-3 text-right tabular-nums">{n}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent/70"
                style={{ width: `${pct}%` }}
                aria-hidden
              />
            </div>
            <span className="w-6 text-right tabular-nums">{val}</span>
          </div>
        );
      })}
    </div>
  );
}
