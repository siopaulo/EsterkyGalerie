import { Skeleton } from "@/components/public/skeleton";
import { PAGINATION } from "@/lib/constants";

export default function StoriesLoading() {
  return (
    <>
      <header className="container-site py-14 md:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Příběhy
        </p>
        <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-tight md:text-6xl">
          Co zůstalo za objektivem
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Krátké reportáže, úvahy a výběry z focení.
        </p>
      </header>

      <section className="container-site pb-8 space-y-6">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-14 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>
      </section>

      <section className="container-site pb-16">
        <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: PAGINATION.stories }).map((_, i) => (
            <li key={i}>
              <Skeleton className="aspect-[4/3] w-full" />
              <Skeleton className="mt-4 h-3 w-24" />
              <Skeleton className="mt-2 h-6 w-3/4" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-1 h-4 w-2/3" />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
