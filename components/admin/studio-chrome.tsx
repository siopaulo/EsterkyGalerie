"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ExternalLink, LogOut, Menu, X } from "lucide-react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { ADMIN_STUDIO_NAV } from "@/lib/admin-studio-nav";
import { cn } from "@/lib/utils";

export function StudioChrome({
  userEmail,
  children,
}: {
  userEmail: string | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- zavřít panel při navigaci (stejný vzor jako veřejný header)
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar userEmail={userEmail} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background md:hidden">
          <div className="flex h-14 items-center justify-between gap-2 px-4">
            <Link href="/studio" className="font-serif text-lg text-foreground">
              Studio
            </Link>
            <button
              type="button"
              className="-mr-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
              aria-label={mobileOpen ? "Zavřít menu" : "Otevřít menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileOpen ? (
            <nav
              aria-label="Studio navigace"
              className="border-t border-border px-4 py-4"
            >
              <ul className="flex flex-col gap-1">
                {ADMIN_STUDIO_NAV.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
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
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-3 border-t border-border pt-3">
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
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-base text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
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
            </nav>
          ) : null}
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
