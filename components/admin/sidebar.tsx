"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_STUDIO_NAV } from "@/lib/admin-studio-nav";

export function AdminSidebar({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();
  return (
    <aside className="hidden border-r border-border bg-background md:flex md:w-64 md:shrink-0 md:flex-col">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href="/studio" className="font-serif text-lg">
          Studio
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
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
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-border p-4">
        {userEmail ? (
          <p className="mb-2 truncate text-xs text-muted-foreground" title={userEmail}>
            {userEmail}
          </p>
        ) : null}
        <form action="/studio/logout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/70 hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Odhlásit
          </button>
        </form>
      </div>
    </aside>
  );
}
