import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth";
import { formatDateCs } from "@/lib/utils";
import { Upload, BookOpen, FileText, Mail } from "lucide-react";

export default async function DashboardPage() {
  const { supabase } = await requireAdmin();

  const [
    { count: photoCount },
    { count: storyCount },
    { count: unread },
    { count: pendingReviews },
    { data: recentMessages },
    { data: recentStories },
  ] = await Promise.all([
    supabase.from("photos").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("stories").select("id", { count: "exact", head: true }),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("handled", false),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("approved", false),
    supabase.from("contact_messages").select("id, name, email, subject, created_at, handled").order("created_at", { ascending: false }).limit(5),
    supabase.from("stories").select("id, title, slug, updated_at").order("updated_at", { ascending: false }).limit(5),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Přehled"
        description="Co se na webu právě děje. Rychlé akce po ruce."
        actions={
          <>
            <Button asChild variant="primary">
              <Link href="/studio/galerie?upload=1">
                <Upload className="h-4 w-4" />
                Nahrát fotku
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/studio/pribehy/novy">
                <BookOpen className="h-4 w-4" />
                Nový příběh
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-6 px-6 py-8 md:grid-cols-5 md:px-10">
        <Stat label="Fotografie" value={photoCount ?? 0} href="/studio/galerie" />
        <Stat label="Příběhy" value={storyCount ?? 0} href="/studio/pribehy" />
        <Stat label="Nové zprávy" value={unread ?? 0} href="/studio/kontakty" tone="accent" />
        <Stat label="Reference ke schválení" value={pendingReviews ?? 0} href="/studio/recenze" tone={pendingReviews && pendingReviews > 0 ? "accent" : undefined} />
        <Stat label="Stránky" value={5} href="/studio/stranky" />
      </div>

      <div className="grid gap-6 px-6 pb-10 md:grid-cols-2 md:px-10">
        <Card>
          <CardHeader>
            <CardTitle>Poslední zprávy</CardTitle>
            <CardDescription>Z kontaktního formuláře na webu.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentMessages && recentMessages.length > 0 ? (
              <ul className="divide-y divide-border">
                {recentMessages.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{m.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{formatDateCs(m.created_at)}</p>
                      {!m.handled ? (
                        <span className="text-xs text-accent-foreground">Nevyřízeno</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Vyřízeno</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Zatím žádné zprávy.</p>
            )}
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/studio/kontakty">
                  <Mail className="h-4 w-4" />
                  Všechny zprávy
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nedávno upravené příběhy</CardTitle>
            <CardDescription>Vracejte se k nim, přidávejte, aktualizujte.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentStories && recentStories.length > 0 ? (
              <ul className="divide-y divide-border">
                {recentStories.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <Link href={`/studio/pribehy/${s.id}`} className="min-w-0 hover:text-accent">
                      <p className="truncate font-medium">{s.title}</p>
                      <p className="truncate text-xs text-muted-foreground">/{s.slug}</p>
                    </Link>
                    <p className="text-xs text-muted-foreground">{formatDateCs(s.updated_at)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Zatím žádné příběhy.</p>
            )}
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/studio/pribehy">
                  <FileText className="h-4 w-4" />
                  Všechny příběhy
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: number;
  href: string;
  tone?: "accent";
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border bg-background p-6 transition-colors hover:border-foreground"
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-3 font-serif text-4xl ${tone === "accent" ? "text-accent" : ""}`}>{value}</p>
    </Link>
  );
}
