import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

type PageRow = {
  id: string;
  slug: string;
  title: string;
  updated_at: string;
};

export default async function StudioPagesIndex() {
  await requireAdmin();
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("pages")
    .select("id, slug, title, updated_at")
    .order("slug");

  const pages = (data ?? []) as PageRow[];
  // Homepage (_home) fixujeme na vrch, je to systémová stránka – reálná URL je `/`.
  const home = pages.find((p) => p.slug === "_home");
  const rest = pages.filter((p) => p.slug !== "_home");
  const ordered: PageRow[] = home ? [home, ...rest] : rest;

  return (
    <>
      <AdminPageHeader
        title="Stránky"
        description="Statické stránky webu s modulárním obsahem. Hlavní stránka je speciální – skládá se ze stejných modulů."
      />
      <section className="max-w-full px-4 py-8 md:px-10">
        {/* Mobile: stacked cards. */}
        <ul className="space-y-3 md:hidden">
          {ordered.map((p) => {
            const isHome = p.slug === "_home";
            return (
              <li key={p.id}>
                <Link
                  href={`/studio/stranky/${p.slug}`}
                  className={`flex items-center gap-3 rounded-lg border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    isHome
                      ? "border-accent/40 bg-accent/5 hover:bg-accent/10"
                      : "border-border bg-background hover:border-foreground/50 hover:bg-muted/30"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 truncate font-medium">
                      {p.title}
                      {isHome ? (
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                          Hlavní stránka
                        </Badge>
                      ) : null}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {isHome ? "/" : `/${p.slug}`}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Desktop: tabulka s klikem na celý řádek (stretched-link). */}
        <div className="hidden w-full max-w-full overflow-x-auto rounded-lg border border-border bg-background md:block">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Název</th>
                <th className="px-5 py-3">URL</th>
                <th className="px-5 py-3 text-right">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {home ? (
                <tr key={home.id} className="relative bg-accent/5 hover:bg-accent/10 focus-within:bg-accent/10">
                  <td className="px-5 py-3 font-medium">
                    <span className="flex items-center gap-2">
                      {home.title}
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                        Hlavní stránka
                      </Badge>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">/</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/studio/stranky/${home.slug}`}
                      className="text-foreground underline underline-offset-4 hover:text-accent before:absolute before:inset-0 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      Upravit
                    </Link>
                  </td>
                </tr>
              ) : null}
              {rest.map((p) => (
                <tr key={p.id} className="relative hover:bg-muted/30 focus-within:bg-muted/30">
                  <td className="px-5 py-3 font-medium">{p.title}</td>
                  <td className="px-5 py-3 text-muted-foreground">/{p.slug}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/studio/stranky/${p.slug}`}
                      className="text-foreground underline underline-offset-4 hover:text-accent before:absolute before:inset-0 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      Upravit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
