import Link from "next/link";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  baseQuery: Record<string, string | string[] | undefined>;
  basePath: string;
}

function buildHref(basePath: string, baseQuery: PaginationProps["baseQuery"], page: number) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(baseQuery)) {
    if (!v || k === "page") continue;
    if (Array.isArray(v)) for (const x of v) params.append(k, x);
    else params.set(k, String(v));
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({ page, totalPages, baseQuery, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = pageRange(page, totalPages);
  return (
    <nav aria-label="Stránkování" className="flex items-center justify-center gap-1">
      <PageLink
        disabled={page <= 1}
        href={buildHref(basePath, baseQuery, Math.max(1, page - 1))}
      >
        ← Předchozí
      </PageLink>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-muted-foreground">
            …
          </span>
        ) : (
          <PageLink
            key={p}
            href={buildHref(basePath, baseQuery, p)}
            active={p === page}
          >
            {p}
          </PageLink>
        ),
      )}
      <PageLink
        disabled={page >= totalPages}
        href={buildHref(basePath, baseQuery, Math.min(totalPages, page + 1))}
      >
        Další →
      </PageLink>
    </nav>
  );
}

function PageLink({
  children,
  href,
  active,
  disabled,
}: React.PropsWithChildren<{ href: string; active?: boolean; disabled?: boolean }>) {
  if (disabled) {
    return (
      <span className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm text-muted-foreground opacity-50">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-9 items-center rounded-md border px-3 text-sm transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border text-foreground hover:border-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

function pageRange(current: number, total: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  const push = (n: number | "…") => out.push(n);
  const near = new Set<number>([1, total, current - 1, current, current + 1]);
  for (let i = 1; i <= total; i++) {
    if (near.has(i)) push(i);
    else if (i === 2 && current - 1 > 3) push("…");
    else if (i === total - 1 && current + 1 < total - 2) push("…");
  }
  // dedupe consecutive duplicates
  return out.filter((v, i) => out[i - 1] !== v);
}
