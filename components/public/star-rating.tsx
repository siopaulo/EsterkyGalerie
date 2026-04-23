"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  /** Pokud definováno, rating je interaktivní. */
  onChange?: (v: number) => void;
  /** Velikost ikony v px (výchozí 22 – hezké v ruce, čitelné z dálky). */
  size?: number;
  /** Přístupný label pro screen readery (radiogroup). */
  label?: string;
  className?: string;
}

/**
 * Hvězdičkové hodnocení 1–5.
 *
 * - Read-only varianta: stačí předat `value` bez `onChange`.
 * - Interaktivní: s `onChange` reaguje na klik i klávesnici (šipky / čísla)
 *   a hoverem ukazuje preview hodnoty.
 */
export function StarRating({
  value,
  onChange,
  size = 22,
  label = "Hodnocení",
  className,
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const interactive = typeof onChange === "function";
  const display = hover ?? value;

  if (!interactive) {
    return (
      <div
        className={cn("inline-flex items-center gap-0.5", className)}
        role="img"
        aria-label={`${label}: ${value} z 5`}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            width={size}
            height={size}
            className={cn(
              "shrink-0",
              i <= value
                ? "fill-accent text-accent"
                : "fill-transparent text-muted-foreground/40",
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex items-center gap-1", className)}
      onMouseLeave={() => setHover(null)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault();
          onChange?.(Math.max(1, value - 1));
        } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault();
          onChange?.(Math.min(5, (value || 0) + 1));
        } else if (/^[1-5]$/.test(e.key)) {
          e.preventDefault();
          onChange?.(Number(e.key));
        }
      }}
      tabIndex={0}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const active = i <= display;
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} z 5`}
            tabIndex={-1}
            onClick={() => onChange?.(i)}
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            className={cn(
              "rounded-md p-0.5 transition-transform",
              "hover:scale-110 focus-visible:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
            )}
          >
            <Star
              width={size}
              height={size}
              className={cn(
                active ? "fill-accent text-accent" : "fill-transparent text-muted-foreground/50",
                "transition-colors",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
