import { PhotoCardSkeleton, Skeleton } from "@/components/public/skeleton";
import { PAGINATION } from "@/lib/constants";

/**
 * Skeleton kopíruje strukturu `/galerie` – stejný eyebrow + h1, search+tag řádky,
 * grid 2/3/4 sloupce. Po fetchi se obsah jen překreslí, layout zůstává.
 */
export default function GalleryLoading() {
  return (
    <>
      <header className="container-site py-14 md:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Galerie
        </p>
        <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-tight md:text-6xl">
          Archiv fotografií
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Všechny veřejné fotky.
        </p>
      </header>

      <section className="container-site pb-8 space-y-6">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-14 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-32" />
      </section>

      <section className="container-site pb-16">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: PAGINATION.gallery }).map((_, i) => (
            <li key={i}>
              <PhotoCardSkeleton />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
