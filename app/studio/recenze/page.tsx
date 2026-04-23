import { AdminPageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { ReviewsTable } from "@/components/admin/reviews-table";
import type { Review } from "@/types/database";
import { safeNumber } from "@/lib/utils";

type SearchParams = Record<string, string | string[] | undefined>;

function one(p: SearchParams[string]): string | undefined {
  if (typeof p === "string") return p;
  if (Array.isArray(p)) return p[0];
  return undefined;
}

export default async function StudioReviewsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  const status = (one(sp.status) ?? "all") as "all" | "pending" | "approved";
  const sort = (one(sp.sort) ?? "newest") as "newest" | "oldest" | "best" | "worst";
  const ratingFilter = one(sp.rating);

  const admin = createSupabaseAdmin();
  let query = admin.from("reviews").select("*", { count: "exact" });

  if (status === "pending") query = query.eq("approved", false);
  if (status === "approved") query = query.eq("approved", true);

  const ratingNum = ratingFilter ? safeNumber(ratingFilter, 0) : 0;
  if (ratingNum >= 1 && ratingNum <= 5) {
    query = query.eq("rating", ratingNum);
  }

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
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, count } = await query.limit(500);
  const rows = (data ?? []) as Review[];

  const [{ count: pendingCount }, { count: approvedCount }] = await Promise.all([
    admin.from("reviews").select("id", { count: "exact", head: true }).eq("approved", false),
    admin.from("reviews").select("id", { count: "exact", head: true }).eq("approved", true),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Reference"
        description="Veřejné recenze z formuláře na /reference. Schválené se zobrazují na webu, ostatní čekají na tvé posouzení."
      />
      <section className="px-6 py-8 md:px-10">
        <ReviewsTable
          rows={rows}
          total={count ?? 0}
          pending={pendingCount ?? 0}
          approved={approvedCount ?? 0}
          filters={{ status, sort, rating: ratingNum || undefined }}
        />
      </section>
    </>
  );
}
