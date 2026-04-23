import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { formatDateCs } from "@/lib/utils";
import { Plus } from "lucide-react";

export default async function StudioStoriesPage() {
  await requireAdmin();
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("stories")
    .select("id, title, slug, published_at, updated_at")
    .order("published_at", { ascending: false });

  const stories = data ?? [];

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
        {stories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
            <p className="font-serif text-2xl">Zatím žádný příběh</p>
            <p className="mt-2 text-sm text-muted-foreground">Začněte tím prvním.</p>
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
      </section>
    </>
  );
}
