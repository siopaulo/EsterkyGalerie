"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import { PhotoCard } from "@/components/public/photo-card";
import type { PhotoWithTags } from "@/types/database";

// Lightbox je interaktivní fullscreen overlay – nikdy se nezobrazuje při
// prvním renderu. Dynamic import drží jeho JS i lucide ikony mimo initial
// bundle galerie a sníží Total JS pro public stránky. ssr=false je v pořádku,
// protože komponenta je zde renderována jen po user akci.
const Lightbox = dynamic(
  () => import("@/components/public/lightbox").then((m) => m.Lightbox),
  { ssr: false },
);

const PHOTO_PARAM = "photo";

/**
 * Sestaví URL `?photo=<id>` se zachováním ostatních query parametrů (filtry,
 * search, page). Když `id` je null, parametr se odebere – návrat na čistou
 * galerii.
 */
function buildUrl(
  pathname: string,
  searchParams: URLSearchParams,
  id: string | null,
): string {
  const params = new URLSearchParams(searchParams.toString());
  if (id) params.set(PHOTO_PARAM, id);
  else params.delete(PHOTO_PARAM);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function PhotoGridWithLightbox({ photos }: { photos: PhotoWithTags[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const idToIndex = useMemo(() => {
    const m = new Map<string, number>();
    photos.forEach((p, i) => m.set(p.id, i));
    return m;
  }, [photos]);

  // Index lightboxu držíme jako lokální state (single source of truth pro UI),
  // URL je jen odraz – sync probíhá přes window.history. Tento přístup chrání
  // před race conditions, které dřív vznikaly tím, že `useSearchParams` dostalo
  // novou hodnotu pomaleji než React stihl rerender (rapid arrow / swipe).
  const initialId = searchParams.get(PHOTO_PARAM);
  const initialIndex =
    initialId && idToIndex.has(initialId) ? (idToIndex.get(initialId) ?? null) : null;
  const [storedIndex, setStoredIndex] = useState<number | null>(initialIndex);

  // Když se sada fotek mezitím změnila (nový search/tag), neukazuj lightbox
  // pro fotku, která už není v aktuálním `photos` poli – derivujeme přímo
  // z renderu, ať nevolaem setState v effectu.
  const index =
    storedIndex !== null && storedIndex >= 0 && storedIndex < photos.length
      ? storedIndex
      : null;

  // Browser back/forward → reaguj na URL a zavři / přepni fotku přirozeně.
  useEffect(() => {
    function onPop() {
      const url = new URL(window.location.href);
      const id = url.searchParams.get(PHOTO_PARAM);
      if (id && idToIndex.has(id)) {
        setStoredIndex(idToIndex.get(id) ?? null);
      } else {
        setStoredIndex(null);
      }
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [idToIndex]);

  const updateUrl = useCallback(
    (id: string | null, replace: boolean) => {
      if (typeof window === "undefined") return;
      const next = buildUrl(pathname, new URLSearchParams(searchParams.toString()), id);
      const url = next.startsWith("/") ? next : `/${next}`;
      if (replace) {
        window.history.replaceState(window.history.state, "", url);
      } else {
        window.history.pushState({ photo: id }, "", url);
      }
    },
    [pathname, searchParams],
  );

  const open = useCallback(
    (i: number) => {
      const photo = photos[i];
      if (!photo) return;
      // pushState → otevření lightboxu si přidá entry do history,
      // browser back lightbox zavře (přirozené chování).
      setStoredIndex(i);
      updateUrl(photo.id, false);
    },
    [photos, updateUrl],
  );

  const change = useCallback(
    (i: number) => {
      const photo = photos[i];
      if (!photo) return;
      // replaceState → procházení mezi fotkami uvnitř lightboxu nezahltí history.
      // Back tak vede z lightboxu rovnou ven.
      setStoredIndex(i);
      updateUrl(photo.id, true);
    },
    [photos, updateUrl],
  );

  const close = useCallback(() => {
    setStoredIndex(null);
    updateUrl(null, false);
  }, [updateUrl]);

  if (!photos.length) return null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {photos.map((p, i) => (
          <li key={p.id}>
            <PhotoCard
              photo={p}
              // LCP karta je vždy první v gridu. Ostatní zůstávají lazy –
              // browser sám eagerně dotáhne ty nad foldem, ale nebudou
              // konkurovat LCP o bandwidth.
              priority={i === 0}
              onClick={() => open(i)}
            />
          </li>
        ))}
      </ul>
      {index !== null ? (
        <Lightbox
          photos={photos}
          index={index}
          onClose={close}
          onIndexChange={change}
        />
      ) : null}
    </>
  );
}
