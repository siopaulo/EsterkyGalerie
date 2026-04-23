import type { Metadata } from "next";
import { Mail, Phone, Instagram, Facebook, MapPin } from "lucide-react";
import { ContactForm } from "@/components/public/contact-form";
import { getSiteSettings } from "@/features/site-settings/queries";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Kontakt",
  useTitleTemplate: true,
  description: "Napište mi. Ráda se ozvu zpět do 48 hodin.",
  path: "/kontakt",
});

export const revalidate = 300;

export default async function KontaktPage() {
  const settings = await getSiteSettings();
  return (
    <>
      <header className="container-site py-14 md:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Kontakt
        </p>
        <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-tight md:text-6xl">
          Napište mi
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Nejrychleji mě zastihnete přes formulář nebo e-mail. Ozvu se obvykle do 48 hodin.
        </p>
      </header>

      <section className="container-site pb-24 grid gap-12 md:grid-cols-[1.4fr_1fr]">
        <div>
          <ContactForm />
        </div>
        <aside className="space-y-6">
          <div className="rounded-lg border border-border bg-muted/30 p-6">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Osobní kontakt
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              {settings.contact_email_public ? (
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${settings.contact_email_public}`}
                    className="text-foreground hover:text-accent"
                  >
                    {settings.contact_email_public}
                  </a>
                </li>
              ) : null}
              {settings.phone ? (
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${settings.phone.replace(/\s+/g, "")}`}
                    className="text-foreground hover:text-accent"
                  >
                    {settings.phone}
                  </a>
                </li>
              ) : null}
              {settings.address ? (
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{settings.address}</span>
                </li>
              ) : null}
            </ul>
          </div>

          {(settings.instagram_url || settings.facebook_url) && (
            <div className="rounded-lg border border-border bg-muted/30 p-6">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Sociální sítě
              </p>
              <div className="mt-4 flex items-center gap-3">
                {settings.instagram_url ? (
                  <a
                    href={settings.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-foreground hover:text-accent"
                  >
                    <Instagram className="h-4 w-4" /> Instagram
                  </a>
                ) : null}
                {settings.facebook_url ? (
                  <a
                    href={settings.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-foreground hover:text-accent"
                  >
                    <Facebook className="h-4 w-4" /> Facebook
                  </a>
                ) : null}
              </div>
            </div>
          )}
        </aside>
      </section>
    </>
  );
}
