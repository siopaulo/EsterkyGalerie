"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Tag } from "@/types/database";

interface TagFilterProps {
  tags: Tag[];
  paramKey?: string;
}

export function TagFilter({ tags, paramKey = "tag" }: TagFilterProps) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const active = useMemo(() => new Set(sp.getAll(paramKey)), [sp, paramKey]);

  const buildHref = (tagSlug: string | null) => {
    const params = new URLSearchParams(sp.toString());
    params.delete(paramKey);
    params.delete("page");
    if (tagSlug) {
      if (active.has(tagSlug)) {
        // toggle off
        for (const v of Array.from(active)) {
          if (v !== tagSlug) params.append(paramKey, v);
        }
      } else {
        for (const v of Array.from(active)) params.append(paramKey, v);
        params.append(paramKey, tagSlug);
      }
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  if (!tags.length) return null;

  return (
    <nav aria-label="Filtr podle tagů" className="flex flex-wrap gap-2">
      <Link
        href={buildHref(null)}
        className={cn(
          "inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors",
          active.size === 0
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-transparent text-foreground hover:border-foreground",
        )}
      >
        Vše
      </Link>
      {tags.map((t) => {
        const isActive = active.has(t.slug);
        return (
          <Link
            key={t.slug}
            href={buildHref(t.slug)}
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors",
              isActive
                ? "border-foreground bg-foreground text-background"
                : "border-border text-foreground hover:border-foreground",
            )}
          >
            {t.name}
          </Link>
        );
      })}
    </nav>
  );
}
