"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { cldUrl, cldSrcSet } from "@/lib/cloudinary-url";
import { formatDateCs } from "@/lib/utils";
import { bulkSoftDeletePhotosAction } from "@/features/photos/actions";
import type { Photo } from "@/types/database";

// Studio admin: 2 sloupce na mobilu, 3 na sm, 5 na lg. Reálná šířka thumbnailu
// nikdy nepřesáhne ~280 CSS px (lg), na mobilu ~360 CSS px. Renderujeme
// ploché Cloudinary URL přímo (q_auto:eco + f_auto = AVIF/WebP), což přeskočí
// /_next/image proxy a doručí zhruba 40 % méně bytů než public defaulty.
const ADMIN_THUMB_WIDTHS = [320, 480, 640];
const ADMIN_THUMB_SIZES =
  "(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw";

interface GalleryPhotoGridProps {
  photos: Photo[];
  page: number;
}

export function GalleryPhotoGrid({ photos, page }: GalleryPhotoGridProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteFromCloudinary, setDeleteFromCloudinary] = useState(false);
  const [, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllOnPage() {
    setSelected(new Set(photos.map((p) => p.id)));
  }

  function clearSelection() {
    setSelected(new Set());
    setDeleteFromCloudinary(false);
  }

  async function runBulkDelete() {
    const ids = Array.from(selected);
    const res = await bulkSoftDeletePhotosAction(ids, deleteFromCloudinary);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(
      res.deleted === ids.length
        ? `Smazáno ${res.deleted} ${res.deleted === 1 ? "fotografie" : "fotografií"}.`
        : `Smazáno ${res.deleted} z ${ids.length} fotografií (část už nebyla k dispozici).`,
    );
    clearSelection();
    startTransition(() => router.refresh());
  }

  const n = selected.size;
  const bulkTitle =
    n === 1
      ? "Opravdu smazat vybranou fotografii?"
      : `Opravdu smazat ${n} ${n >= 2 && n <= 4 ? "fotografie" : "fotografií"}?`;

  return (
    <>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {photos.map((p, i) => {
          const variant = {
            crop: "fill" as const,
            gravity: "auto" as const,
            quality: "auto:eco" as const,
          };
          const src = cldUrl(p.cloudinary_public_id, { ...variant, width: 480 });
          const srcSet = cldSrcSet(p.cloudinary_public_id, ADMIN_THUMB_WIDTHS, variant);
          const eager = page === 1 && i < 6;
          const isOn = selected.has(p.id);
          return (
            <li key={p.id} className="relative">
              <div
                className="absolute left-2 top-2 z-20 flex items-center rounded-md bg-background/90 p-0.5 shadow-sm ring-1 ring-black/10"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={isOn}
                  onCheckedChange={() => toggle(p.id)}
                  aria-label={`Vybrat fotografii „${p.display_name}“`}
                />
              </div>
              <Link
                href={`/studio/galerie/${p.id}`}
                className="group relative block overflow-hidden rounded-md bg-muted"
              >
                <div className="relative aspect-[4/5] w-full">
                  <img
                    src={src}
                    srcSet={srcSet || undefined}
                    sizes={ADMIN_THUMB_SIZES}
                    alt={p.alt_text || p.display_name}
                    loading={eager ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={page === 1 && i < 2 ? "high" : "auto"}
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="line-clamp-1 text-sm text-white">{p.display_name}</p>
                  <p className="text-xs text-white/70">{formatDateCs(p.created_at)}</p>
                </div>
                {p.visibility === "hidden" ? (
                  <Badge className="absolute left-2 top-10 bg-black/80 text-white">Skrytá</Badge>
                ) : null}
                {p.is_featured_home ? (
                  <Badge className="absolute right-2 top-2 bg-accent text-accent-foreground">Vybraná</Badge>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>

      {n > 0 ? (
        <div
          className="fixed bottom-6 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/95 p-4 shadow-lg backdrop-blur-sm md:left-auto md:right-8 md:translate-x-0 md:max-w-none"
          role="toolbar"
          aria-label="Hromadné akce pro vybrané fotky"
        >
          <p className="text-sm font-medium">
            Vybráno: {n}{" "}
            <button
              type="button"
              className="ml-2 text-xs text-muted-foreground underline underline-offset-4"
              onClick={selectAllOnPage}
            >
              vše na stránce
            </button>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={clearSelection}>
              Zrušit výběr
            </Button>
            <ConfirmDialog
              title={bulkTitle}
              description="Vybrané fotky budou skryty z webu. Pokud jsou někde použité, nahradí je placeholder. Tuto akci nelze jednoduše vrátit zpět."
              confirmLabel="Smazat vybrané"
              onConfirm={runBulkDelete}
              extraContent={
                <label className="mt-3 flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={deleteFromCloudinary}
                    onCheckedChange={(v) => setDeleteFromCloudinary(v === true)}
                  />
                  <span>
                    Smazat z Cloudinary tam, kde to jde (jen fotky bez reference na webu)
                  </span>
                </label>
              }
            >
              <Button type="button" variant="destructive" size="sm" aria-label="Smazat vybrané fotky">
                <Trash2 className="h-4 w-4" aria-hidden /> Smazat
              </Button>
            </ConfirmDialog>
          </div>
        </div>
      ) : null}
    </>
  );
}
