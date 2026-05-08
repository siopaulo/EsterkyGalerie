"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hook hlídající dva signály, které mají pozastavit autoplay carouselu:
 *   1. `IntersectionObserver` – carousel není ve viewportu (uživatel ho nevidí)
 *   2. `document.visibilityState === "hidden"` – uživatel přepnul tab / minimalizoval okno
 *
 * Cíl je dvojí:
 *  - šetřit CPU/baterii na mobilu (žádný `setInterval` mimo viewport),
 *  - zabránit „skoku“ slidů při návratu na tab (uživatel vidí čerstvý slide,
 *    ne ten, na který timer poskočil mezitím).
 *
 * Vrací `inView` (je viditelný i tab je aktivní). Přiřazení `ref` na obalový
 * `<div>` carouselu je nutné.
 */
export function useCarouselVisibility<T extends HTMLElement = HTMLDivElement>(): {
  ref: (node: T | null) => void;
  inView: boolean;
} {
  // Element je defaultně považován za in-view, dokud IO neřekne jinak –
  // zabraňuje to flashu "paused" stavu v první mikrosekundě po mount.
  const [intersecting, setIntersecting] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const elRef = useRef<T | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // IntersectionObserver – pauzne carousel, když není (alespoň částečně) ve viewportu.
  // Threshold 0 + rootMargin "200px" = začne počítat, jakmile se blíží zdola obrazovky,
  // což zabraňuje fliku při rychlém scrollu.
  const ref = (node: T | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    elRef.current = node;
    if (node && typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          setIntersecting(entry.isIntersecting);
        },
        { threshold: 0, rootMargin: "200px" },
      );
      io.observe(node);
      observerRef.current = io;
    }
  };

  // Visibility API – pauzne, když je tab schovaný.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisibility = () => {
      setTabVisible(document.visibilityState !== "hidden");
    };
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Cleanup IO na unmount.
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, []);

  return { ref, inView: intersecting && tabVisible };
}
