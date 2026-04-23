"use client";

import { useEffect, useRef, useState, type TouchEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CloudinaryImage } from "@/components/shared/cloudinary-image";
import { cn } from "@/lib/utils";
import type { Photo } from "@/types/database";

interface HomeHeroCarouselProps {
  photos: Photo[];
  autoPlayMs?: number;
}

/**
 * Hero carousel – hlavní fotografie + decentní offset-thumbnail vpravo dole.
 * Oproti staré verzi:
 *  - accent má výrazně menší plochu (~28 % šířky hlavní fotky)
 *  - umístěn uvnitř hranic kontejneru, žádný extrémní overflow
 *  - cross-fade pouze hlavní fotky, accent se mění synchronně
 *  - auto-rotate s pauzou na hover/focus
 */
export function HomeHeroCarousel({ photos, autoPlayMs = 5000 }: HomeHeroCarouselProps) {
  const safe = photos.filter((p) => p && p.cloudinary_public_id);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (safe.length <= 1 || paused || autoPlayMs <= 0) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % safe.length);
    }, autoPlayMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [safe.length, paused, autoPlayMs]);

  if (safe.length === 0) return null;

  const accentIndex = safe.length > 1 ? (index + 1) % safe.length : -1;

  const goPrev = () => setIndex((i) => (i - 1 + safe.length) % safe.length);
  const goNext = () => setIndex((i) => (i + 1) % safe.length);

  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    touchStartX.current = t.clientX;
  }
  function onTouchEnd(e: TouchEvent) {
    if (touchStartX.current == null || safe.length <= 1) return;
    const t = e.changedTouches[0];
    if (!t) {
      touchStartX.current = null;
      return;
    }
    const dx = t.clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) goNext();
    else goPrev();
  }

  const arrowBtnClass =
    "absolute top-1/2 z-10 -translate-y-1/2 inline-flex h-11 w-11 min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-full bg-background/90 text-foreground shadow-md ring-1 ring-black/10 backdrop-blur-sm transition-all opacity-100 md:opacity-0 md:group-hover/carousel:opacity-100 md:focus-visible:opacity-100 hover:bg-background";

  return (
    <div
      className="group/carousel relative touch-pan-y"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative overflow-hidden rounded-md shadow-xl aspect-[4/5] md:aspect-[5/6]">
        {safe.map((photo, i) => (
          <div
            key={photo.id}
            aria-hidden={i !== index}
            className={cn(
              "absolute inset-0 transition-opacity duration-[900ms] ease-out",
              i === index ? "opacity-100" : "opacity-0",
            )}
          >
            <CloudinaryImage
              publicId={photo.cloudinary_public_id}
              alt={photo.alt_text || photo.display_name}
              aspectClass=""
              className="h-full w-full"
              variant={{ crop: "fill", gravity: "auto" }}
              sizes="(min-width:1024px) 40vw, (min-width:768px) 50vw, 100vw"
              priority={i === 0}
            />
          </div>
        ))}

        {safe.length > 1 ? (
          <>
            <button type="button" onClick={goPrev} aria-label="Předchozí fotka" className={cn(arrowBtnClass, "left-2")}>
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" onClick={goNext} aria-label="Další fotka" className={cn(arrowBtnClass, "right-2")}>
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </>
        ) : null}
      </div>

      {accentIndex >= 0 ? (
        <div
          className={cn(
            "pointer-events-none absolute -bottom-6 -right-6 hidden w-[38%] overflow-hidden rounded-md shadow-2xl ring-1 ring-black/10 md:block",
            "transition-opacity duration-[900ms]",
          )}
          style={{ aspectRatio: "4 / 3" }}
        >
          {safe.map((photo, i) => (
            <div
              key={photo.id}
              aria-hidden={i !== accentIndex}
              className={cn(
                "absolute inset-0 transition-opacity duration-[900ms] ease-out",
                i === accentIndex ? "opacity-100" : "opacity-0",
              )}
            >
              <CloudinaryImage
                publicId={photo.cloudinary_public_id}
                alt=""
                aspectClass=""
                className="h-full w-full"
                variant={{ crop: "fill", gravity: "auto" }}
                sizes="25vw"
              />
            </div>
          ))}
        </div>
      ) : null}

      {safe.length > 1 ? (
        <div className="mt-6 flex items-center gap-2" role="tablist" aria-label="Výběr fotky">
          {safe.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Fotka ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-[3px] rounded-full transition-all",
                i === index
                  ? "w-8 bg-foreground"
                  : "w-4 bg-foreground/25 hover:bg-foreground/50",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
