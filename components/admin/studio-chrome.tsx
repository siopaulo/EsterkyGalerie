"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ADMIN_STUDIO_NAV } from "@/lib/admin-studio-nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- zavřít drawer při navigaci (stejný vzor jako veřejný header)
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar userEmail={userEmail} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 md:hidden">
          <Link href="/studio" className="font-serif text-lg text-foreground">
            Studio
          </Link>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            aria-label={mobileOpen ? "Zavřít menu" : "Otevřít menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="right" className="flex max-w-[min(100vw,20rem)] flex-col gap-0 p-0">
            <div className="border-b border-border px-4 py-4 pr-12">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Studio</p>
              <p className="mt-1 font-serif text-xl">Navigace</p>
            </div>
            <nav className="flex-1 overflow-y-auto p-3" aria-label="Studio navigace">
              <ul className="space-y-0.5">
                {ADMIN_STUDIO_NAV.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-3 text-base transition-colors",
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
            </nav>
            <div className="mt-auto border-t border-border p-4">
              {userEmail ? (
                <p className="mb-3 break-all text-xs text-muted-foreground" title={userEmail}>
                  {userEmail}
                </p>
              ) : null}
              <form action="/studio/logout" method="post">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-3 text-sm font-medium hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" />
                  Odhlásit
                </button>
              </form>
            </div>
          </SheetContent>
        </Sheet>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
