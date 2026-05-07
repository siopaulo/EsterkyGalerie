"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
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

export function PhotoGridWithLightbox({ photos }: { photos: PhotoWithTags[] }) {
  const [index, setIndex] = useState<number | null>(null);
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
              onClick={() => setIndex(i)}
            />
          </li>
        ))}
      </ul>
      {index !== null ? (
        <Lightbox
          photos={photos}
          index={index}
          onClose={() => setIndex(null)}
          onIndexChange={setIndex}
        />
      ) : null}
    </>
  );
}
