import { Skeleton } from "@/components/public/skeleton";

export default function StoryLoading() {
  return (
    <article>
      <header className="container-site pt-14 pb-10 md:pt-20 md:pb-14">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="mt-6 h-3 w-32" />
        <Skeleton className="mt-3 h-12 w-full max-w-3xl md:h-16" />
        <Skeleton className="mt-5 h-5 w-full max-w-xl" />
        <Skeleton className="mt-2 h-5 w-3/4 max-w-xl" />
      </header>

      <div className="container-site">
        <Skeleton className="aspect-[16/9] w-full" />
      </div>

      <section className="container-site py-16 md:py-20">
        <div className="mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-11/12" />
          <Skeleton className="h-5 w-10/12" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      </section>
    </article>
  );
}
