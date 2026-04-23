import type { Metadata } from "next";
import Link from "next/link";
import { fetchPageBySlug } from "@/features/pages/queries";
import { BlockRenderer } from "@/features/blocks/render";
import { collectPhotoIds } from "@/features/blocks/collect-ids";
import { fetchPhotosByIds } from "@/features/photos/queries";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchPageBySlug("sluzby");
  return buildMetadata({
    title: data?.page.seo_title || data?.page.title || "Služby",
    description: data?.page.seo_description,
    path: "/sluzby",
  });
}

const DEFAULT_FAQ = [
  {
    q: "Jak focení probíhá?",
    a: "Nejdříve si napíšeme, domluvíme termín a místo. Doporučuju zlatou hodinu ráno nebo večer. Fotíme pomalu, v klidu, bez nucení do pozic.",
  },
  {
    q: "Kolik fotek dostanu?",
    a: "Podle balíčku 15–40 upravených fotek. Výběr z celé session vám pošlu v online galerii.",
  },
  {
    q: "Jak dlouho čekám na fotky?",
    a: "Upravené fotky posílám obvykle do 3 týdnů od focení.",
  },
  {
    q: "Kde fotíte? Dojedete za mnou?",
    a: "Sídlím v Horažďovicích a v okolí Plzeňského a Jihočeského kraje fotím bez příplatku. Ke vzdálenějším lokacím se rád/a domluvím – cestovné nad 30 km se účtuje dle dohody.",
  },
];

export default async function SluzbyPage() {
  const data = await fetchPageBySlug("sluzby");

  const photoIds = data ? collectPhotoIds(data.blocks) : [];
  const photos = photoIds.length ? await fetchPhotosByIds(photoIds) : [];
  const photoMap = new Map(photos.map((p) => [p.id, p]));

  return (
    <>
      <header className="container-site py-14 md:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Služby
        </p>
        <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-tight md:text-6xl">
          {data?.page.title ?? "Fotografické služby"}
        </h1>
        {data?.page.intro ? (
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{data.page.intro}</p>
        ) : null}
      </header>

      {data && data.blocks.length > 0 ? (
        <section className="container-site pb-24">
          <BlockRenderer blocks={data.blocks} photos={photoMap} />
        </section>
      ) : (
        <>
          <section className="container-site pb-10">
            <div className="grid gap-10 md:grid-cols-3">
              {[
                { t: "Koně a jezdci", d: "Portréty, pohyb, detail. Fotím tam, kde se cítíte doma." },
                { t: "Osobní portrét", d: "Rodinné, partnerské nebo autoportréty v přírodě." },
                { t: "Editorial a reportáže", d: "Koncepční focení pro značky, stáje a závody." },
              ].map((s) => (
                <div key={s.t} className="rounded-lg border border-border p-6">
                  <h3 className="font-serif text-2xl">{s.t}</h3>
                  <p className="mt-2 text-muted-foreground">{s.d}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="container-site py-16">
            <h2 className="font-serif text-3xl md:text-4xl">Jak probíhá focení</h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-4">
              {[
                ["01", "Domluva", "Napíšete, zjistíme si, co si přejete."],
                ["02", "Plán", "Vybereme místo, čas a náladu."],
                ["03", "Focení", "V klidu, bez tlaku."],
                ["04", "Dodání", "Online galerie a výběr nejlepších."],
              ].map(([n, t, d]) => (
                <li key={n} className="rounded-lg bg-muted/40 p-6">
                  <p className="font-serif text-xl text-accent-foreground">{n}</p>
                  <p className="mt-1 font-serif text-xl">{t}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{d}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="container-site py-16">
            <h2 className="font-serif text-3xl md:text-4xl">Časté dotazy</h2>
            <dl className="mt-8 divide-y divide-border border-t border-b border-border">
              {DEFAULT_FAQ.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer items-start justify-between gap-4">
                    <dt className="font-serif text-xl">{f.q}</dt>
                    <span className="mt-1 text-muted-foreground transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <dd className="mt-3 text-muted-foreground">{f.a}</dd>
                </details>
              ))}
            </dl>
          </section>

          <section className="container-site py-16">
            <div className="mx-auto max-w-3xl rounded-xl border border-border bg-muted/40 p-10 text-center">
              <h2 className="font-serif text-3xl md:text-4xl">Pojďme se domluvit</h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Odepíšu obvykle do 48 hodin. Napíšete mi, co byste rádi, já pošlu návrh.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg" variant="primary">
                  <Link href="/kontakt">Napsat</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/cenik">Ceník</Link>
                </Button>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
