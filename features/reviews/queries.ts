import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Review } from "@/types/database";

export interface ReviewsPage {
  rows: Review[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ReviewsSummary {
  count: number;
  average: number | null;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export type PublicReviewsSort = "newest" | "oldest" | "best" | "worst";

/**
 * Veřejný list schválených recenzí. Čte přes anon client,
 * RLS filtruje neschválené.
 */
export async function listApprovedReviews(opts: {
  page?: number;
  pageSize?: number;
  sort?: PublicReviewsSort;
}): Promise<ReviewsPage> {
  const pageSize = Math.max(1, Math.min(50, opts.pageSize ?? 10));
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const sort: PublicReviewsSort = opts.sort ?? "newest";

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("reviews")
    .select("*", { count: "exact" })
    .eq("approved", true);

  switch (sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "best":
      query = query
        .order("rating", { ascending: false })
        .order("created_at", { ascending: false });
      break;
    case "worst":
      query = query
        .order("rating", { ascending: true })
        .order("created_at", { ascending: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const { data, count } = await query.range(from, to);

  const total = count ?? 0;
  return {
    rows: (data ?? []) as Review[],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/**
 * Agregát pro summary sekci – průměr a distribuce.
 * Pro malý počet recenzí je fetch všech stále levný; pro větší počty
 * lze později nahradit materializovaným viewem nebo RPC.
 */
export async function getReviewsSummary(): Promise<ReviewsSummary> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("reviews")
    .select("rating")
    .eq("approved", true)
    .limit(5000);

  const rows = (data ?? []) as Array<{ rating: number }>;
  const count = rows.length;
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  if (count === 0) {
    return { count: 0, average: null, distribution };
  }

  let sum = 0;
  for (const r of rows) {
    const k = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[k] += 1;
    sum += k;
  }
  const average = Math.round((sum / count) * 10) / 10;
  return { count, average, distribution };
}
