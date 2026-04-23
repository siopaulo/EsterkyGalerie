import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export default async function StudioPagesIndex() {
  await requireAdmin();
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("pages")
    .select("id, slug, title, updated_at")
    .order("slug");

  const pages = data ?? [];
  // Homepage (_home) fixujeme na vrch, je to systémová stránka – reálná URL je `/`.
  const home = pages.find((p) => p.slug === "_home");
  const rest = pages.filter((p) => p.slug !== "_home");

  return (
    <>
      <AdminPageHeader
        title="Stránky"
        description="Statické stránky webu s modulárním obsahem. Hlavní stránka je speciální – skládá se ze stejných modulů."
      />
      <section className="px-6 py-8 md:px-10">
        <div className="overflow-hidden rounded-lg border border-border bg-background">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Název</th>
                <th className="px-5 py-3">URL</th>
                <th className="px-5 py-3 text-right">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {home ? (
                <tr key={home.id} className="bg-accent/5 hover:bg-accent/10">
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
                      className="text-foreground underline underline-offset-4 hover:text-accent"
                    >
                      Upravit
                    </Link>
                  </td>
                </tr>
              ) : null}
              {rest.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3 font-medium">{p.title}</td>
                  <td className="px-5 py-3 text-muted-foreground">/{p.slug}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/studio/stranky/${p.slug}`}
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
      </section>
    </>
  );
}
