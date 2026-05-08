import { cn } from "@/lib/utils";

/**
 * Sdílené skeleton primitivy pro `loading.tsx` segmenty.
 *
 * Drží se stávajícího barevného systému (`bg-muted`) a respektuje
 * `prefers-reduced-motion` přes `motion-safe:` – uživatelé s vypnutými
 * animacemi vidí statický placeholder bez pulzování.
 *
 * Cíl: skeleton drží *přibližně* stejný layout jako finální obsah,
 * aby po načtení nebyl viditelný layout shift (CLS).
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-md bg-muted/70 motion-safe:animate-pulse",
        className,
      )}
      {...props}
    />
  );
}

/** Aspect-ratio placeholder pro foto-grid karty (4:5 jako PhotoCard). */
export function PhotoCardSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("aspect-[4/5] w-full", className)} />;
}
