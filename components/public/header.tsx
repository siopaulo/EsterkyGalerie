"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { PUBLIC_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface HeaderProps {
  siteName: string;
  tagline?: string;
}

export function PublicHeader({ siteName, tagline }: HeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // Zavřít mobilní menu při změně URL (back/forward i programová navigace).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- jediný řádek, žádná kaskáda s jiným stavem
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "bg-background/85 backdrop-blur-md shadow-[0_1px_0_0_var(--color-border)]"
          : "bg-gradient-to-b from-background/70 via-background/40 to-transparent backdrop-blur-[2px]",
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-[2px] transition-opacity duration-300",
          scrolled ? "opacity-100" : "opacity-0",
        )}
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--color-accent) 50%, transparent 100%)",
        }}
      />
      <div className="container-site flex h-[68px] items-center justify-between gap-6">
        <Link
          href="/"
          className="group flex items-center gap-3 text-foreground"
          aria-label={siteName}
        >
          <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-background/60 ring-1 ring-border transition-all group-hover:ring-accent/60 group-hover:shadow-sm">
            <Image
              src="/logo.png"
              alt=""
              width={44}
              height={44}
              priority
              className="h-full w-full object-cover"
            />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-[22px] tracking-tight">{siteName}</span>
            {tagline ? (
              <span className="mt-[3px] hidden text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground sm:block">
                {tagline}
              </span>
            ) : null}
          </span>
        </Link>

        <nav aria-label="Hlavní navigace" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {PUBLIC_NAV.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "relative inline-flex items-center rounded-full px-4 py-2 text-sm tracking-wide transition-colors",
                      active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute left-4 right-4 bottom-[6px] h-[1.5px] origin-center transition-transform duration-300",
                        active ? "scale-x-100 bg-accent" : "scale-x-0 bg-accent/60",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          type="button"
          className="lg:hidden -mr-2 inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-muted transition-colors"
          aria-label={mobileOpen ? "Zavřít menu" : "Otevřít menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="lg:hidden border-t border-border bg-background">
          <nav aria-label="Mobilní navigace" className="container-site py-4">
            <ul className="flex flex-col gap-1">
              {PUBLIC_NAV.map((item) => {
                const active =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "block rounded-md px-3 py-2 text-base",
                        active
                          ? "bg-muted text-foreground"
                          : "text-foreground/80 hover:bg-muted hover:text-foreground",
                      )}
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
