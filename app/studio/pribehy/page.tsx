import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { formatDateCs, safeNumber } from "@/lib/utils";
import { Pagination } from "@/components/public/pagination";
import { Plus } from "lucide-react";

type SP = Promise<{ [k: string]: string | string[] | undefined }>;

const PER_PAGE = 25;

export default async function StudioStoriesPage({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, safeNumber(sp.page, 1));
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  const admin = createSupabaseAdmin();
  let query = admin
    .from("stories")
    .select("id, title, slug, published_at, updated_at", { count: "exact" })
    .order("published_at", { ascending: false })
    .range(from, to);
  if (q) {
    const needle = `%${q}%`;
    query = query.or(`title.ilike.${needle},slug.ilike.${needle}`);
  }
  const { data, count } = await query;

  const stories = data ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <>
      <AdminPageHeader
        title="Příběhy"
        description="Modulární obsahové příběhy z focení."
        actions={
          <Button asChild variant="primary">
            <Link href="/studio/pribehy/novy">
              <Plus className="h-4 w-4" /> Nový příběh
            </Link>
          </Button>
        }
      />
      <section className="px-6 py-8 md:px-10">
        <form className="mb-6 flex flex-wrap items-center gap-3" method="get">
          <Input
            name="q"
            defaultValue={q}
            placeholder="Hledat v názvu…"
            className="max-w-xs"
            aria-label="Hledat v názvu nebo slugu"
          />
          <button type="submit" className="h-10 rounded-md border border-border px-4 text-sm hover:bg-muted">
            Hledat
          </button>
          {q ? (
            <Link
              href="/studio/pribehy"
              className="text-sm text-muted-foreground underline underline-offset-4"
            >
              Vymazat
            </Link>
          ) : null}
          <p className="ml-auto text-sm text-muted-foreground">{total} položek</p>
        </form>

        {total === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
            <p className="font-serif text-2xl">
              {q ? "Nic neodpovídá" : "Zatím žádný příběh"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {q ? "Zkuste jiný výraz." : "Začněte tím prvním."}
            </p>
          </div>
        ) : stories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
            <p className="font-serif text-2xl">Na této stránce nic není</p>
            <p className="mt-2 text-sm text-muted-foreground">Zkuste předchozí stránku nebo upravte hledání.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Název</th>
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3">Datum</th>
                  <th className="px-5 py-3">Upraveno</th>
                  <th className="px-5 py-3 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stories.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3 font-medium">{s.title}</td>
                    <td className="px-5 py-3 text-muted-foreground">/{s.slug}</td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDateCs(s.published_at)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDateCs(s.updated_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/studio/pribehy/${s.id}`}
                        className="text-foreground underline underline-offset-4 hover:text-accent"
                      >
                        Upravit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-10">
            <Pagination page={page} totalPages={totalPages} baseQuery={sp} basePath="/studio/pribehy" />
          </div>
        ) : null}
      </section>
    </>
  );
}
