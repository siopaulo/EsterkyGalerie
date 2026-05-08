import { Skeleton, PhotoCardSkeleton } from "@/components/public/skeleton";

export default function StudioGalleryLoading() {
  return (
    <>
      <header className="border-b border-border bg-background">
        <div className="max-w-full px-4 py-6 md:px-10 md:py-8">
          <h1 className="font-serif text-3xl md:text-4xl">Galerie</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Centrální knihovna všech fotek. Nahrávejte, upravujte metadata, mažte bezpečně.
          </p>
        </div>
      </header>
      <section className="max-w-full px-4 py-6 pb-24 md:px-10 md:py-8 md:pb-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Skeleton className="h-10 w-full sm:max-w-xs" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="ml-auto hidden h-4 w-24 sm:block" />
        </div>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 15 }).map((_, i) => (
            <li key={i}>
              <PhotoCardSkeleton />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
