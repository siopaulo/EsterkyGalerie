"use client";

import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cldUrl } from "@/lib/cloudinary-url";

export interface PhotoLite {
  id: string;
  display_name: string;
  cloudinary_public_id: string;
  alt_text: string;
  visibility: "public" | "hidden";
}

interface PhotoPickerProps {
  photos: PhotoLite[];
  value?: string | null;
  values?: string[];
  multi?: boolean;
  onChange: (ids: string[]) => void;
  trigger?: React.ReactNode;
  label?: string;
}

/**
 * Dialog picker pro výběr fotky/fotek z galerie.
 *
 * UX kontrakt:
 * - Rozpracovaný výběr (`working`) žije JEN po dobu otevřeného dialogu.
 * - Cancel / křížek / klik mimo: nic se nezmění, committed výběr zůstává.
 * - Při každém otevření se `working` resetuje z committed hodnoty,
 *   takže tam nikdy nezůstane „cache“ z minulé neuložené relace.
 * - Single-select: klik na již vybranou fotku ji odvybere.
 *   Klik na jinou fotku ji hned prohodí – není potřeba nic zavírat.
 */
export function PhotoPicker({
  photos,
  value,
  values,
  multi,
  onChange,
  trigger,
  label = "Vybrat fotku",
}: PhotoPickerProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const committed = useMemo(
    () => (multi ? values ?? [] : value ? [value] : []),
    [value, values, multi],
  );

  const [working, setWorking] = useState<Set<string>>(() => new Set(committed));

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return photos;
    return photos.filter(
      (p) =>
        p.display_name.toLowerCase().includes(s) ||
        p.alt_text.toLowerCase().includes(s),
    );
  }, [photos, q]);

  function toggle(id: string) {
    setWorking((set) => {
      const next = new Set(set);
      if (multi) {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      } else {
        if (next.has(id)) {
          next.clear();
        } else {
          next.clear();
          next.add(id);
        }
      }
      return next;
    });
  }

  function save() {
    onChange(Array.from(working));
    setOpen(false);
  }

  function cancel() {
    setOpen(false);
  }

  function clearAll() {
    setWorking(new Set());
  }

  const workingCount = working.size;

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : (
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          {label}
        </Button>
      )}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            setWorking(new Set(committed));
            setQ("");
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>
              {multi
                ? "Vyberte jednu nebo více fotek z knihovny. Klikem fotku přidáte nebo odeberete."
                : "Vyberte fotku z knihovny. Klikem na vybranou fotku ji odeberete, klikem na jinou ji vyměníte."}
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Hledat podle názvu nebo alt textu…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="max-h-[55vh] overflow-y-auto rounded-md border border-border bg-muted/20 p-2">
            {filtered.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                Žádné fotky neodpovídají filtru.
              </div>
            ) : (
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {filtered.map((p) => {
                  const on = working.has(p.id);
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => toggle(p.id)}
                        aria-pressed={on}
                        className={`group relative block w-full overflow-hidden rounded-md border-2 transition-all ${
                          on
                            ? "border-accent ring-2 ring-accent/30"
                            : "border-transparent hover:border-border"
                        }`}
                      >
                        <img
                          src={cldUrl(p.cloudinary_public_id, { width: 300, crop: "fill", gravity: "auto" })}
                          alt=""
                          className="aspect-[4/5] w-full object-cover"
                          loading="lazy"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left text-[11px] text-white">
                          {p.display_name}
                        </span>
                        {on ? (
                          <span className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground shadow">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground">
                {workingCount === 0
                  ? "Nic nevybráno"
                  : multi
                    ? `Vybráno ${workingCount} fotek`
                    : "1 fotka vybrána"}
              </p>
              {workingCount > 0 ? (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Zrušit výběr
                </button>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={cancel}>
                Zavřít bez uložení
              </Button>
              <Button variant="primary" onClick={save}>
                Použít výběr
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PhotoChip({
  photo,
  onRemove,
}: {
  photo: PhotoLite | undefined;
  onRemove?: () => void;
}) {
  if (!photo) {
    return (
      <div className="flex h-12 items-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-3 text-xs text-muted-foreground">
        Chybí fotografie
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-background p-2">
      <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full">
        <img
          src={cldUrl(photo.cloudinary_public_id, { width: 120, crop: "fill", gravity: "auto" })}
          alt=""
          className="h-full w-full object-cover"
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{photo.display_name}</p>
        <p className="text-xs text-muted-foreground">{photo.visibility === "hidden" ? "skrytá" : "veřejná"}</p>
      </div>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Odebrat"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
