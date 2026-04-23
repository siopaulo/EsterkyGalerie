"use client";

import { useState } from "react";
import { PhotoCard } from "@/components/public/photo-card";
import { Lightbox } from "@/components/public/lightbox";
import type { PhotoWithTags } from "@/types/database";

export function PhotoGridWithLightbox({ photos }: { photos: PhotoWithTags[] }) {
  const [index, setIndex] = useState<number | null>(null);
  if (!photos.length) return null;
  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {photos.map((p, i) => (
          <li key={p.id}>
            <PhotoCard photo={p} priority={i < 4} onClick={() => setIndex(i)} />
          </li>
        ))}
      </ul>
      <Lightbox photos={photos} index={index} onClose={() => setIndex(null)} onIndexChange={setIndex} />
    </>
  );
}
