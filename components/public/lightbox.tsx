"use client";

import { useCallback, useEffect, useRef, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cldUrl, FULL_WIDTHS, cldSrcSet } from "@/lib/cloudinary-url";
import type { PhotoWithTags } from "@/types/database";
import { cn } from "@/lib/utils";

interface LightboxProps {
  photos: PhotoWithTags[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

/** Minimální pixelová vzdálenost, která se ještě počítá jako swipe gesto. */
const SWIPE_THRESHOLD = 40;
/** Maximální vertikální drift při swipe – víc = uživatel scrolluje, ne swajpuje. */
const SWIPE_VERTICAL_TOLERANCE = 80;

export function Lightbox({ photos, index, onClose, onIndexChange }: LightboxProps) {
  const open = index !== null && index >= 0 && index < photos.length;

  const goPrev = useCallback(() => {
    if (index === null || photos.length <= 1) return;
    onIndexChange((index - 1 + photos.length) % photos.length);
  }, [index, photos.length, onIndexChange]);

  const goNext = useCallback(() => {
    if (index === null || photos.length <= 1) return;
    onIndexChange((index + 1) % photos.length);
  }, [index, photos.length, onIndexChange]);

  // Klávesové zkratky + body scroll lock. Listener se re-attachuje, kdykoliv
  // se mění goPrev / goNext (= když se změní `index`), aby uvnitř callbacku
  // nečteme zastaralý index. Performance dopad je zanedbatelný (jeden listener),
  // ale chování je deterministické i při rychlém ARROW spamování.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);

    // Body scroll lock – uložíme předchozí hodnotu, ať při zavření vrátíme
    // přesně to, co tam bylo (např. když jiný overlay scroll lock už držel).
    const prevOverflow = document.body.style.overflow;
    const prevOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.body.style.overscrollBehavior = prevOverscroll;
    };
  }, [open, onClose, goPrev, goNext]);

  // Pointer-based swipe. ID gesto držíme v ref, ať vyřešíme pointer cancel
  // / multi-touch a nevolal se goNext omylem dvakrát (např. když uživatel
  // swipuje přes tlačítko – buttony si touchstart berou pro click, ale
  // pointerdown bublá → správně rozhodneme až po pointerup podle dx).
  const pointerStart = useRef<{ id: number; x: number; y: number } | null>(null);

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    // Bereme jen primární prst / myš / pen – ignorujeme druhý prst (pinch).
    if (!e.isPrimary) return;
    pointerStart.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  }, []);

  const finishGesture = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const start = pointerStart.current;
      if (!start || start.id !== e.pointerId) return;
      pointerStart.current = null;
      if (photos.length <= 1) return;
      // Při drag-cancelu (pointercancel) považujeme gesto za zrušené.
      if (e.type === "pointercancel") return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      // Klik na tlačítko / overlay – malý pohyb, žádný swipe. Click handler si
      // to vyřídí sám (bublá z `onClick` na buttonu).
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      // Když je vertikální posun dominantní, považujeme to za scroll → ignore.
      if (Math.abs(dy) > SWIPE_VERTICAL_TOLERANCE) return;
      if (Math.abs(dy) > Math.abs(dx)) return;
      if (dx < 0) goNext();
      else goPrev();
    },
    [photos.length, goNext, goPrev],
  );

  if (!open || index === null) return null;
  const photo = photos[index];
  if (!photo) return null;

  const counterLabel = `${index + 1} / ${photos.length}`;

  return (
    <div
      className="fixed inset-0 z-50 flex select-none items-center justify-center bg-black/95 [touch-action:pan-y]"
      role="dialog"
      aria-modal="true"
      aria-label={photo.alt_text || photo.display_name}
      onPointerDown={onPointerDown}
      onPointerUp={finishGesture}
      onPointerCancel={finishGesture}
    >
      {/* Position counter (top-left) – nepřekrývá zavírací křížek vpravo nahoře. */}
      <div
        className="pointer-events-none absolute left-4 top-4 z-10 select-none rounded-full bg-white/10 px-3 py-1 text-xs font-medium tabular-nums text-white/90 backdrop-blur-sm"
        aria-live="polite"
      >
        <span className="sr-only">Fotografie </span>
        {counterLabel}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="Zavřít (Esc)"
      >
        <X className="h-5 w-5" />
      </button>

      {photos.length > 1 ? (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 inline-flex h-12 w-12 min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:left-4"
            aria-label="Předchozí fotografie"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 inline-flex h-12 w-12 min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:right-4"
            aria-label="Další fotografie"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      ) : null}

      <figure className="flex max-h-[90vh] max-w-[95vw] flex-col items-center">
        {/* Vlastní srcSet pro Cloudinary – next/image by šablonu nezjednodušil. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photo.id}
          src={cldUrl(photo.cloudinary_public_id, { width: 1800, quality: "auto:best" })}
          srcSet={cldSrcSet(photo.cloudinary_public_id, FULL_WIDTHS, { quality: "auto:best" })}
          sizes="95vw"
          alt={photo.alt_text || photo.display_name}
          className={cn("max-h-[85vh] w-auto object-contain shadow-2xl")}
          loading="eager"
          decoding="async"
          draggable={false}
        />
        <figcaption className="mt-3 max-w-xl text-center text-sm text-white/80">
          {photo.display_name}
          {photo.tags.length ? (
            <span className="ml-2 text-white/50">
              · {photo.tags.map((t) => t.name).join(", ")}
            </span>
          ) : null}
        </figcaption>
      </figure>
    </div>
  );
}
