"use client";

import { useEffect, useRef, useState, type TouchEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CloudinaryImage } from "@/components/shared/cloudinary-image";
import { cn } from "@/lib/utils";
import type { Photo } from "@/types/database";

interface GalleryShowcaseProps {
  photos: Photo[];
  autoPlayMs?: number;
  layout?: "editorial" | "fade" | "strip";
}

/**
 * Editorial showcase bez překrytí – 3 možné layouty:
 *   - editorial: velký landscape + 2 menší portréty ve sloupci vpravo (rotuje sada po 3)
 *   - fade:      jeden velký landscape, cross-fade mezi fotkami
 *   - strip:     řada čtvercových náhledů (bez auto-rotace)
 */
export function GalleryShowcase({
  photos,
  autoPlayMs = 5000,
  layout = "editorial",
}: GalleryShowcaseProps) {
  if (photos.length === 0) return null;
  if (layout === "strip") return <StripLayout photos={photos} />;
  if (layout === "fade") return <FadeLayout photos={photos} autoPlayMs={autoPlayMs} />;
  return <EditorialLayout photos={photos} autoPlayMs={autoPlayMs} />;
}

/**
 * Editorial layout – jeden velký snímek vlevo, dvě menší vpravo.
 * Auto-rotuje trojice (0,1,2) → (3,4,5) → …, bez překrytí,
 * s čistým fade přechodem a decentním progress indikátorem.
 */
function EditorialLayout({ photos, autoPlayMs }: { photos: Photo[]; autoPlayMs: number }) {
  const groups = groupByN(photos, 3);
  const { index, paused, handlers, goTo } = useAutoplay(groups.length, autoPlayMs);
  if (groups.length === 0) return null;

  return (
    <div {...handlers} className="group/carousel relative touch-pan-y">
      <div className="relative grid gap-4 md:grid-cols-[1.6fr_1fr] md:gap-6">
        <div className="relative overflow-hidden rounded-md bg-muted aspect-[4/5] md:aspect-[4/5] lg:aspect-[5/6]">
          {groups.map(([main], i) => (
            <div
              key={`main-${i}`}
              aria-hidden={i !== index}
              className={cn(
                "absolute inset-0 transition-opacity duration-[900ms] ease-out",
                i === index ? "opacity-100" : "opacity-0",
              )}
            >
              {main ? (
                <CloudinaryImage
                  publicId={main.cloudinary_public_id}
                  alt={main.alt_text || main.display_name}
                  aspectClass=""
                  className="h-full w-full"
                  variant={{ crop: "fill", gravity: "auto" }}
                  sizes="(min-width:1024px) 55vw, 100vw"
                />
              ) : null}
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:gap-6">
          <div className="relative overflow-hidden rounded-md bg-muted aspect-[4/3]">
            {groups.map(([, a], i) => (
              <div
                key={`a-${i}`}
                aria-hidden={i !== index}
                className={cn(
                  "absolute inset-0 transition-opacity duration-[900ms] ease-out",
                  i === index ? "opacity-100" : "opacity-0",
                )}
              >
                {a ? (
                  <CloudinaryImage
                    publicId={a.cloudinary_public_id}
                    alt={a.alt_text || a.display_name}
                    aspectClass=""
                    className="h-full w-full"
                    variant={{ crop: "fill", gravity: "auto" }}
                    sizes="(min-width:1024px) 30vw, 50vw"
                  />
                ) : null}
              </div>
            ))}
          </div>
          <div className="relative hidden overflow-hidden rounded-md bg-muted aspect-[4/3] md:block">
            {groups.map(([, , b], i) => (
              <div
                key={`b-${i}`}
                aria-hidden={i !== index}
                className={cn(
                  "absolute inset-0 transition-opacity duration-[900ms] ease-out",
                  i === index ? "opacity-100" : "opacity-0",
                )}
              >
                {b ? (
                  <CloudinaryImage
                    publicId={b.cloudinary_public_id}
                    alt={b.alt_text || b.display_name}
                    aspectClass=""
                    className="h-full w-full"
                    variant={{ crop: "fill", gravity: "auto" }}
                    sizes="(min-width:1024px) 30vw, 50vw"
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {groups.length > 1 ? (
          <CarouselArrows
            onPrev={() => goTo(index - 1)}
            onNext={() => goTo(index + 1)}
          />
        ) : null}
      </div>

      {groups.length > 1 ? (
        <div className="mt-5 flex items-center justify-center gap-2">
          {groups.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Zobrazit sadu ${i + 1}`}
              aria-pressed={i === index}
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
      ) : null}

      {paused && groups.length > 1 ? (
        <p className="sr-only" aria-live="polite">Carousel je pozastaven.</p>
      ) : null}
    </div>
  );
}

/**
 * Fade layout – jedna veliká fotka, která se cross-fade mění.
 * Minimalistický, žádné překryvy ani vedlejší prvky.
 */
function FadeLayout({ photos, autoPlayMs }: { photos: Photo[]; autoPlayMs: number }) {
  const { index, handlers, goTo } = useAutoplay(photos.length, autoPlayMs);
  return (
    <div {...handlers} className="group/carousel relative touch-pan-y">
      <div className="relative overflow-hidden rounded-md bg-muted aspect-[16/10] md:aspect-[21/9]">
        {photos.map((p, i) => (
          <div
            key={p.id}
            aria-hidden={i !== index}
            className={cn(
              "absolute inset-0 transition-opacity duration-[900ms] ease-out",
              i === index ? "opacity-100" : "opacity-0",
            )}
          >
            <CloudinaryImage
              publicId={p.cloudinary_public_id}
              alt={p.alt_text || p.display_name}
              aspectClass=""
              className="h-full w-full"
              variant={{ crop: "fill", gravity: "auto" }}
              sizes="100vw"
            />
          </div>
        ))}
        {photos.length > 1 ? (
          <CarouselArrows
            onPrev={() => goTo(index - 1)}
            onNext={() => goTo(index + 1)}
          />
        ) : null}
      </div>
      {photos.length > 1 ? (
        <div className="mt-5 flex items-center justify-center gap-2">
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Fotka ${i + 1}`}
              aria-pressed={i === index}
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
      ) : null}
    </div>
  );
}

/**
 * Strip layout – statický horizontální carousel se scroll-snap.
 * Žádný JS ani auto-advance – SSR friendly.
 */
function StripLayout({ photos }: { photos: Photo[] }) {
  return (
    <div className="-mx-4 overflow-x-auto pb-3 [scrollbar-width:thin] sm:mx-0 snap-x snap-mandatory">
      <ul className="flex gap-3 px-4 sm:px-0 sm:gap-4">
        {photos.map((p) => (
          <li
            key={p.id}
            className="snap-start shrink-0 w-[80%] sm:w-[48%] md:w-[36%] lg:w-[28%]"
          >
            <div className="overflow-hidden rounded-md bg-muted aspect-[4/5]">
              <CloudinaryImage
                publicId={p.cloudinary_public_id}
                alt={p.alt_text || p.display_name}
                aspectClass=""
                className="h-full w-full"
                variant={{ crop: "fill", gravity: "auto" }}
                sizes="(min-width:1024px) 30vw, 50vw"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- helpers ----------

/**
 * Šipky prev/next, které se zobrazí při hoveru nad carouselem.
 * Očekává, že rodičovský kontejner má `group/carousel` className.
 */
function CarouselArrows({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  const base =
    "absolute top-1/2 z-10 -translate-y-1/2 inline-flex h-11 w-11 min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-full bg-background/90 text-foreground shadow-md ring-1 ring-black/10 backdrop-blur-sm transition-all opacity-100 md:opacity-0 md:group-hover/carousel:opacity-100 md:focus-visible:opacity-100 hover:bg-background";
  return (
    <>
      <button
        type="button"
        onClick={onPrev}
        aria-label="Předchozí"
        className={cn(base, "left-3")}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onNext}
        aria-label="Další"
        className={cn(base, "right-3")}
      >
        <ChevronRight className="h-5 w-5" aria-hidden />
      </button>
    </>
  );
}

function groupByN<T>(arr: T[], n: number): T[][] {
  if (arr.length === 0) return [];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function useAutoplay(total: number, autoPlayMs: number) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (total <= 1 || paused || autoPlayMs <= 0) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, autoPlayMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, paused, autoPlayMs]);

  const handlers = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onFocusCapture: () => setPaused(true),
    onBlurCapture: () => setPaused(false),
    onTouchStart: (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      touchStartX.current = t.clientX;
    },
    onTouchEnd: (e: TouchEvent) => {
      if (touchStartX.current == null || total <= 1) return;
      const t = e.changedTouches[0];
      if (!t) {
        touchStartX.current = null;
        return;
      }
      const dx = t.clientX - touchStartX.current;
      touchStartX.current = null;
      if (Math.abs(dx) < 48) return;
      setIndex((cur) => (dx < 0 ? (cur + 1) % total : (cur - 1 + total) % total));
    },
  };

  return {
    index,
    paused,
    goTo: (i: number) => setIndex(((i % total) + total) % total),
    handlers,
  };
}
