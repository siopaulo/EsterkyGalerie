import { Skeleton } from "@/components/public/skeleton";

export default function ReferenceLoading() {
  return (
    <>
      <header className="container-site py-14 md:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Reference
        </p>
        <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-tight md:text-6xl">
          Co říkají klienti
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Upřímné ohlasy z focení – bez filtrů, bez úprav.
        </p>
      </header>

      <section className="container-site pb-8">
        <Skeleton className="h-32 w-full rounded-xl md:h-28" />
      </section>

      <section className="container-site pb-24 grid gap-12 md:grid-cols-[1.4fr_1fr]">
        <div className="order-2 md:order-1 space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-background p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-2 h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-11/12" />
              <Skeleton className="mt-2 h-4 w-3/4" />
            </div>
          ))}
        </div>
        <aside className="order-1 md:order-2">
          <Skeleton className="h-[420px] w-full rounded-lg" />
        </aside>
      </section>
    </>
  );
}
