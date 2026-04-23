import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { fetchPageBySlug } from "@/features/pages/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/features/site-settings/queries";
import type { PricingItem } from "@/types/database";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const [data, settings] = await Promise.all([fetchPageBySlug("cenik"), getSiteSettings()]);
  return buildMetadata({
    title: data?.page.seo_title || data?.page.title || "Ceník",
    description: data?.page.seo_description,
    path: "/cenik",
    useTitleTemplate: true,
    siteName: settings.site_name,
  });
}

export default async function CenikPage() {
  const [page, supabase] = await Promise.all([
    fetchPageBySlug("cenik"),
    createSupabaseServerClient(),
  ]);
  const { data: itemsData } = await supabase
    .from("pricing_items")
    .select("*")
    .order("section", { ascending: true })
    .order("sort_order", { ascending: true });

  const items = (itemsData ?? []) as PricingItem[];
  const sections = groupBy(items, (i) => i.section);

  const sectionOrder = ["balicky", "doplnky", "default"];
  const sectionLabels: Record<string, string> = {
    balicky: "Balíčky",
    doplnky: "Doplňky",
    default: "Další",
  };

  return (
    <>
      <header className="container-site py-14 md:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Ceník</p>
        <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-tight md:text-6xl">
          {page?.page.title ?? "Ceník"}
        </h1>
        {page?.page.intro ? (
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{page.page.intro}</p>
        ) : null}
      </header>

      <section className="container-site pb-16 space-y-16">
        {sectionOrder
          .filter((s) => sections.get(s)?.length)
          .map((section) => (
            <div key={section}>
              <h2 className="font-serif text-3xl md:text-4xl">{sectionLabels[section] ?? section}</h2>
              <ul className="mt-8 grid gap-6 md:grid-cols-3">
                {(sections.get(section) ?? []).map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col rounded-lg border border-border bg-background p-7 shadow-sm"
                  >
                    <h3 className="font-serif text-2xl">{item.title}</h3>
                    {item.description ? (
                      <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                    ) : null}
                    {item.price_label ? (
                      <p className="mt-4 font-serif text-3xl text-foreground">{item.price_label}</p>
                    ) : null}
                    {item.features?.length ? (
                      <ul className="mt-5 space-y-2 text-sm">
                        {item.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 text-accent" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </section>

      <section className="container-site pb-24">
        <div className="mx-auto max-w-3xl rounded-xl border border-border bg-muted/40 p-10 text-center">
          <h2 className="font-serif text-3xl md:text-4xl">Chybí to, co hledáte?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Ráda připravím nabídku přesně na míru. Napište mi, co potřebujete.
          </p>
          <div className="mt-6">
            <Button asChild size="lg" variant="primary">
              <Link href="/kontakt">Napsat zprávu</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function groupBy<T, K>(arr: T[], key: (t: T) => K): Map<K, T[]> {
  const out = new Map<K, T[]>();
  for (const item of arr) {
    const k = key(item);
    const list = out.get(k);
    if (list) list.push(item);
    else out.set(k, [item]);
  }
  return out;
}
