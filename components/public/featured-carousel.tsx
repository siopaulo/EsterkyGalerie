"use client";

import { useEffect, useRef, useState } from "react";
import { CloudinaryImage } from "@/components/shared/cloudinary-image";
import { cn } from "@/lib/utils";
import type { Photo } from "@/types/database";

interface FeaturedCarouselProps {
  photos: Photo[];
  autoPlayMs?: number;
}

/**
 * Editorial showcase – dvě fotky na pár (hlavní + menší odsazená),
 * automaticky rotuje každých ~5s, pauza při hover/focus.
 *
 * Co se stane s lichým počtem fotek: poslední pár použije úvodní fotku
 * jako accent, aby layout zůstal vyplněný bez „děr“.
 */
export function FeaturedCarousel({ photos, autoPlayMs = 5000 }: FeaturedCarouselProps) {
  const pairs = buildPairs(photos);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (pairs.length <= 1 || paused) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % pairs.length);
    }, autoPlayMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pairs.length, paused, autoPlayMs]);

  if (pairs.length === 0) return null;

  function goTo(i: number) {
    setIndex(((i % pairs.length) + pairs.length) % pairs.length);
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative mx-auto aspect-[4/5] w-full overflow-hidden rounded-lg sm:aspect-[5/4] lg:aspect-[16/10]">
        {pairs.map(([main, accent], i) => {
          const active = i === index;
          return (
            <div
              key={`${main.id}-${accent?.id ?? "x"}-${i}`}
              aria-hidden={!active}
              className={cn(
                "absolute inset-0 transition-opacity duration-[900ms] ease-out",
                active ? "opacity-100" : "opacity-0",
              )}
            >
              <div className="relative h-full w-full">
                <div className="absolute inset-0 overflow-hidden rounded-lg shadow-xl">
                  <CloudinaryImage
                    publicId={main.cloudinary_public_id}
                    alt={main.alt_text || main.display_name}
                    aspectClass=""
                    className="h-full w-full"
                    variant={{ crop: "fill", gravity: "auto" }}
                    sizes="(min-width:1024px) 70vw, 100vw"
                    priority={i === 0}
                  />
                </div>
                {accent ? (
                  <div
                    className={cn(
                      "absolute bottom-4 right-4 hidden w-[38%] overflow-hidden rounded-lg shadow-2xl ring-1 ring-black/10 transition-transform duration-[900ms] sm:block",
                      active ? "translate-y-0" : "translate-y-3",
                    )}
                  >
                    <CloudinaryImage
                      publicId={accent.cloudinary_public_id}
                      alt={accent.alt_text || accent.display_name}
                      aspectClass="aspect-[4/5]"
                      variant={{ crop: "fill", gravity: "auto" }}
                      sizes="30vw"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/15 to-transparent" />
      </div>

      {pairs.length > 1 ? (
        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2" role="tablist" aria-label="Výběr fotky">
            {pairs.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Přepnout na výběr ${i + 1}`}
                onClick={() => goTo(i)}
                className={cn(
                  "h-[3px] rounded-full transition-all",
                  i === index
                    ? "w-10 bg-foreground"
                    : "w-5 bg-foreground/25 hover:bg-foreground/50",
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/70 transition-colors hover:border-foreground hover:text-foreground"
              aria-label="Předchozí"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/70 transition-colors hover:border-foreground hover:text-foreground"
              aria-label="Další"
            >
              ›
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Rozdělí fotky na dvojice main/accent.
 * - sudý počet: [[0,1],[2,3],…]
 * - lichý počet: poslední pár má accent = photos[0], ať layout „nedojde“.
 * - 1 fotka: jeden pár bez accentu.
 */
function buildPairs(photos: Photo[]): Array<[Photo, Photo | undefined]> {
  const first = photos[0];
  if (!first) return [];
  if (photos.length === 1) return [[first, undefined]];
  const pairs: Array<[Photo, Photo | undefined]> = [];
  for (let i = 0; i < photos.length; i += 2) {
    const main = photos[i];
    if (!main) continue;
    const accent: Photo | undefined = photos[i + 1] ?? first;
    pairs.push([main, accent]);
  }
  return pairs;
}
