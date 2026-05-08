"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ExternalLink, LogOut, Menu, X } from "lucide-react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { ADMIN_STUDIO_NAV, type StudioBadges } from "@/lib/admin-studio-nav";
import { StudioNavBadge } from "@/components/admin/studio-nav-badge";
import { cn } from "@/lib/utils";

export function StudioChrome({
  userEmail,
  badges,
  children,
}: {
  userEmail: string | null;
  badges?: StudioBadges;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- zavřít panel při navigaci (stejný vzor jako veřejný header)
    setMobileOpen(false);
  }, [pathname]);

  // Souhrnná hodnota pro decentní tečku u hamburgeru, když je menu zavřené.
  const totalBadge =
    (badges?.messages ?? 0) + (badges?.reviews ?? 0);

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar userEmail={userEmail} badges={badges} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={cn(
            "sticky top-0 z-30 border-b border-border bg-background md:hidden",
            mobileOpen
              ? "shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)]"
              : undefined,
          )}
        >
          <div className="flex h-14 items-center justify-between gap-2 px-4">
            <Link
              href="/studio"
              className="font-serif text-lg text-foreground"
            >
              Studio
            </Link>
            <button
              type="button"
              className="relative -mr-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
              aria-label={mobileOpen ? "Zavřít menu" : "Otevřít menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              {!mobileOpen && totalBadge > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-background"
                />
              ) : null}
            </button>
          </div>

          {mobileOpen ? (
            <div className="border-t border-border bg-background">
              <nav
                aria-label="Studio navigace"
                className="px-4 pb-2 pt-3"
              >
                <ul className="flex flex-col gap-1">
                  {ADMIN_STUDIO_NAV.map((item) => {
                    const active = item.exact
                      ? pathname === item.href
                      : pathname.startsWith(item.href);
                    const count = item.badgeKey ? badges?.[item.badgeKey] ?? 0 : 0;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-base transition-colors",
                            active
                              ? "bg-muted font-medium text-foreground"
                              : "text-foreground/80 hover:bg-muted hover:text-foreground",
                          )}
                          onClick={() => setMobileOpen(false)}
                        >
                          <item.Icon className="h-5 w-5 shrink-0" />
                          <span className="flex-1 truncate">{item.label}</span>
                          {count > 0 ? <StudioNavBadge count={count} /> : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="border-t border-border bg-muted/30 px-4 py-3">
                <Link
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-base text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ExternalLink className="h-5 w-5 shrink-0" />
                  Náhled webu
                </Link>
                <form action="/studio/logout" method="post">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-base text-red-700 transition-colors hover:bg-red-50 hover:text-red-800"
                  >
                    <LogOut className="h-5 w-5 shrink-0" />
                    Odhlásit
                  </button>
                </form>
                {userEmail ? (
                  <p
                    className="mt-2 break-all px-3 text-xs text-muted-foreground"
                    title={userEmail}
                  >
                    {userEmail}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
