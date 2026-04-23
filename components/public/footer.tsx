import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Mail, Phone } from "lucide-react";
import type { SiteSettings } from "@/types/database";

export function PublicFooter({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-border bg-muted/30">
      <div className="container-site py-14 grid gap-10 md:grid-cols-3">
        <div>
          <Image
            src="/logo.png"
            alt=""
            width={72}
            height={72}
            className="mb-3 h-14 w-14 object-contain"
          />
          <p className="font-serif text-2xl text-foreground">{settings.site_name}</p>
          {settings.site_tagline ? (
            <p className="mt-2 text-sm text-muted-foreground">{settings.site_tagline}</p>
          ) : null}
        </div>

        <nav aria-label="Patička">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Na webu
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/o-mne" className="hover:text-foreground text-foreground/80">O mně</Link></li>
            <li><Link href="/sluzby" className="hover:text-foreground text-foreground/80">Služby</Link></li>
            <li><Link href="/galerie" className="hover:text-foreground text-foreground/80">Galerie</Link></li>
            <li><Link href="/pribehy" className="hover:text-foreground text-foreground/80">Příběhy</Link></li>
            <li><Link href="/cenik" className="hover:text-foreground text-foreground/80">Ceník</Link></li>
            <li><Link href="/kontakt" className="hover:text-foreground text-foreground/80">Kontakt</Link></li>
            <li>
              <Link
                href="/ochrana-osobnich-udaju"
                className="hover:text-foreground text-muted-foreground"
              >
                Ochrana osobních údajů
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Kontakt
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {settings.contact_email_public ? (
              <li className="flex items-center gap-2 text-foreground/80">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${settings.contact_email_public}`} className="hover:text-foreground">
                  {settings.contact_email_public}
                </a>
              </li>
            ) : null}
            {settings.phone ? (
              <li className="flex items-center gap-2 text-foreground/80">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${settings.phone.replace(/\s+/g, "")}`} className="hover:text-foreground">
                  {settings.phone}
                </a>
              </li>
            ) : null}
          </ul>
          <div className="mt-4 flex items-center gap-3">
            {settings.instagram_url ? (
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noopener noreferrer me"
                aria-label="Instagram"
                className="text-muted-foreground hover:text-foreground"
              >
                <Instagram className="h-5 w-5" />
              </a>
            ) : null}
            {settings.facebook_url ? (
              <a
                href={settings.facebook_url}
                target="_blank"
                rel="noopener noreferrer me"
                aria-label="Facebook"
                className="text-muted-foreground hover:text-foreground"
              >
                <Facebook className="h-5 w-5" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-site py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {year} {settings.site_name}. Všechna práva vyhrazena.</p>
          <p>
            Vytvořil{" "}
            <a
              href="https://github.com/PavelVrsecky"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-transparent underline-offset-4 transition-colors hover:text-foreground hover:decoration-current"
            >
              Pavel Vršecký
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
