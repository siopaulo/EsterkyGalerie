import { Skeleton } from "@/components/public/skeleton";

interface AdminTableSkeletonProps {
  /** Hlavička admin stránky – cca 2 řádky text + případně action button. */
  title: string;
  description?: string;
  /** Počet řádek skeletu (mobile + desktop). */
  rows?: number;
  /** Když true, ukáže nahoře search bar placeholder. */
  withSearch?: boolean;
}

/**
 * Skeleton verze admin list page (Galerie / Příběhy / Recenze / Kontakty).
 * Drží stejnou strukturu jako `AdminPageHeader` + následná section.
 */
export function AdminTableSkeleton({
  title,
  description,
  rows = 8,
  withSearch = true,
}: AdminTableSkeletonProps) {
  return (
    <>
      <header className="border-b border-border bg-background">
        <div className="max-w-full px-4 py-6 md:px-10 md:py-8">
          <h1 className="font-serif text-3xl md:text-4xl">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </header>
      <section className="max-w-full px-4 py-8 md:px-10">
        {withSearch ? (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Skeleton className="h-10 w-full sm:max-w-xs" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="ml-auto hidden h-4 w-24 sm:block" />
          </div>
        ) : null}

        {/* Mobile cards */}
        <ul className="space-y-3 md:hidden">
          {Array.from({ length: rows }).map((_, i) => (
            <li key={i} className="rounded-lg border border-border bg-background p-4">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="mt-2 h-3 w-1/3" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </li>
          ))}
        </ul>

        {/* Desktop table */}
        <div className="hidden w-full max-w-full overflow-hidden rounded-lg border border-border bg-background md:block">
          <div className="border-b border-border bg-muted/40 px-5 py-3">
            <Skeleton className="h-3 w-24" />
          </div>
          <ul className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, i) => (
              <li key={i} className="flex items-center gap-6 px-5 py-4">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="hidden h-4 w-32 lg:block" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
