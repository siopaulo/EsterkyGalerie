import { cn } from "@/lib/utils";

interface StudioNavBadgeProps {
  count: number;
  /** Vizuálně menší varianta pro hustší layouty (např. desktop sidebar). */
  variant?: "default" | "sm";
  className?: string;
}

/**
 * Číselný odznak vedle položky studio navigace.
 *
 * Zobrazí se pouze ve studiu (počty se počítají per-request v `app/studio/layout.tsx`).
 * Záměrně bez polling/refresh – aktualizuje se přes `router.refresh()` po akci nebo
 * při příští navigaci.
 */
export function StudioNavBadge({
  count,
  variant = "default",
  className,
}: StudioNavBadgeProps) {
  if (count <= 0) return null;
  const display = count > 99 ? "99+" : String(count);
  return (
    <span
      aria-label={`${count} nevyřízených`}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-accent font-medium text-accent-foreground tabular-nums",
        variant === "sm"
          ? "h-4 min-w-4 px-1 text-[10px]"
          : "h-5 min-w-5 px-1.5 text-xs",
        className,
      )}
    >
      {display}
    </span>
  );
}
