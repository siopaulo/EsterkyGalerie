"use client";

import { useMemo, useRef, useState } from "react";
import { Trash2, ChevronUp, ChevronDown, Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BLOCK_LABELS,
  BLOCK_TYPES,
  type BlockType,
  parseBlockPayload,
} from "@/features/blocks/schemas";
import { PhotoPicker, PhotoChip, type PhotoLite } from "@/components/admin/photo-picker";
import { Checkbox } from "@/components/ui/checkbox";

export interface BlockDraft {
  id?: string;
  block_type: BlockType;
  payload: Record<string, unknown>;
}

/**
 * Stabilní klientský klíč pro draft bloku.
 * Pokud blok přišel z DB, má ID. Nové bloky dostanou lokální UUID,
 * aby React neztrácel focus při reorderu a přidávání nových bloků.
 */
function useStableKeys(value: BlockDraft[]): string[] {
  const keysRef = useRef(new WeakMap<BlockDraft, string>());
  return useMemo(() => {
    const map = keysRef.current;
    return value.map((b) => {
      if (b.id) return b.id;
      const existing = map.get(b);
      if (existing) return existing;
      const k =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);
      map.set(b, k);
      return k;
    });
  }, [value]);
}

interface BlockEditorProps {
  value: BlockDraft[];
  onChange: (blocks: BlockDraft[]) => void;
  photos: PhotoLite[];
  /** Volitelné omezení nabídky bloků (např. pro homepage „modul“ editor). */
  allowedTypes?: BlockType[];
}

const DEFAULT_PAYLOAD: Record<BlockType, Record<string, unknown>> = {
  hero: { title: "Nadpis", subtitle: "", align: "left" },
  rich_text: { html: "<p>Text…</p>" },
  section_heading: { title: "Nadpis sekce", align: "left", eyebrow: "", description: "" },
  single_image: { photo_id: "", caption: "", aspect: "auto" },
  image_pair: { left_photo_id: "", right_photo_id: "", caption: "" },
  image_carousel: { photo_ids: [], caption: "" },
  photo_grid: { photo_ids: [], columns: 3 },
  quote: { quote: "", author: "", context: "" },
  cta: { title: "Nadpis CTA", primary: { label: "Napsat", href: "/kontakt" } },
  faq: { items: [{ question: "Otázka?", answer: "Odpověď." }] },
  featured_photos: { photo_ids: [], title: "", description: "", view_all_href: "/galerie" },
  story_intro: { title: "Název příběhu", subtitle: "", date: undefined, cover_photo_id: undefined },
  home_hero: {
    eyebrow: "Fotografie",
    title: "Světlo, kůň, okamžik",
    subtitle: "Portrétní a životní fotografie koní, jezdců a jejich světa.",
    cta_primary: { label: "Prohlédnout galerii", href: "/galerie" },
    cta_secondary: { label: "Chci se objednat", href: "/kontakt" },
    photo_ids: [],
    auto_rotate_ms: 5000,
  },
  home_about: {
    eyebrow: "O autorce",
    title: "Fotografie, která stojí za to zvednout ze stolu.",
    paragraphs: [
      "Fotím s citem pro charakter i světlo. Miluju klidné portréty a momenty, které jsou autentické.",
      "Pracuju ráda v plenéru, v mlžných ránech i v tlumeném zimním světle.",
    ],
    link_label: "O mně víc",
    link_href: "/o-mne",
  },
  home_gallery_carousel: {
    eyebrow: "Vybrané fotografie",
    title: "Z poslední doby",
    view_all_label: "Celá galerie",
    view_all_href: "/galerie",
    use_featured: true,
    photo_ids: [],
    auto_rotate_ms: 5000,
    layout: "editorial",
  },
  home_service_cta: {
    eyebrow: "Služba",
    title: "Portrétní focení koní a jezdců",
    description: "Pracuji s jedním zákazníkem po celý den – bez spěchu, s maximem péče.",
    cta_primary: { label: "Zjistit víc", href: "/sluzby" },
    cta_secondary: { label: "Ozvat se", href: "/kontakt" },
    background: "muted",
  },
  home_stories_feed: {
    eyebrow: "Příběhy",
    title: "Nejnovější",
    view_all_label: "Všechny příběhy",
    view_all_href: "/pribehy",
    count: 3,
  },
};

export function BlockEditor({ value, onChange, photos, allowedTypes }: BlockEditorProps) {
  const photoMap = useMemo(() => new Map(photos.map((p) => [p.id, p])), [photos]);
  const keys = useStableKeys(value);
  const addableTypes = allowedTypes ?? BLOCK_TYPES;

  function update(i: number, next: BlockDraft) {
    const copy = [...value];
    copy[i] = next;
    onChange(copy);
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const copy = [...value];
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
    onChange(copy);
  }
  function remove(i: number) {
    const copy = [...value];
    copy.splice(i, 1);
    onChange(copy);
  }
  function addBlock(type: BlockType) {
    const next: BlockDraft = { block_type: type, payload: structuredClone(DEFAULT_PAYLOAD[type]) };
    onChange([...value, next]);
  }

  return (
    <div className="space-y-4">
      {value.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
          <p className="font-serif text-xl">Zatím žádné moduly</p>
          <p className="mt-1 text-sm text-muted-foreground">Přidejte první blok níže.</p>
        </div>
      ) : (
        value.map((b, i) => {
          const parsed = parseBlockPayload(b.block_type, b.payload);
          const invalid = !parsed.ok;
          return (
            <div
              key={keys[i]}
              className={`rounded-lg border bg-background p-5 shadow-sm ${invalid ? "border-red-400" : "border-border"}`}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {BLOCK_LABELS[b.block_type] ?? b.block_type}
                  </span>
                  {invalid ? (
                    <span className="inline-flex items-center gap-1 text-xs text-red-700">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Chybí / neplatná data
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="rounded p-1.5 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Přesunout nahoru"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === value.length - 1}
                    className="rounded p-1.5 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Přesunout dolů"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Opravdu smazat tento blok?")) remove(i);
                    }}
                    className="rounded p-1.5 text-red-700 transition-colors hover:bg-red-50"
                    aria-label="Smazat blok"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <BlockFields block={b} onChange={(n) => update(i, n)} photoMap={photoMap} photos={photos} />
            </div>
          );
        })
      )}

      <AddBlock onAdd={addBlock} types={addableTypes} />
    </div>
  );
}

function AddBlock({ onAdd, types }: { onAdd: (t: BlockType) => void; types: BlockType[] }) {
  const [type, setType] = useState<BlockType>(types[0] ?? "rich_text");
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-4">
      <Select value={type} onValueChange={(v) => setType(v as BlockType)}>
        <SelectTrigger className="max-w-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {types.map((t) => (
            <SelectItem key={t} value={t}>
              {BLOCK_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="button" variant="primary" onClick={() => onAdd(type)}>
        <Plus className="h-4 w-4" /> Přidat modul
      </Button>
    </div>
  );
}

// -------------- Individual block fields --------------

function BlockFields({
  block,
  onChange,
  photoMap,
  photos,
}: {
  block: BlockDraft;
  onChange: (b: BlockDraft) => void;
  photoMap: Map<string, PhotoLite>;
  photos: PhotoLite[];
}) {
  const setField = (patch: Record<string, unknown>) =>
    onChange({ ...block, payload: { ...block.payload, ...patch } });

  switch (block.block_type) {
    case "hero":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nadpis">
            <Input
              value={String(block.payload.title ?? "")}
              onChange={(e) => setField({ title: e.target.value })}
            />
          </Field>
          <Field label="Podnadpis">
            <Input
              value={String(block.payload.subtitle ?? "")}
              onChange={(e) => setField({ subtitle: e.target.value })}
            />
          </Field>
          <Field label="Zarovnání">
            <Select
              value={String(block.payload.align ?? "left")}
              onValueChange={(v) => setField({ align: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Vlevo</SelectItem>
                <SelectItem value="center">Na střed</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Fotka na pozadí">
            <div className="flex items-center gap-2">
              <PhotoPicker
                photos={photos}
                value={(block.payload.background_photo_id as string) ?? undefined}
                onChange={(ids) => setField({ background_photo_id: ids[0] ?? null })}
              />
              {block.payload.background_photo_id ? (
                <Button type="button" variant="ghost" onClick={() => setField({ background_photo_id: null })}>Odebrat</Button>
              ) : null}
            </div>
            {block.payload.background_photo_id ? (
              <div className="mt-2">
                <PhotoChip photo={photoMap.get(block.payload.background_photo_id as string)} />
              </div>
            ) : null}
          </Field>
          <Field label="Hlavní tlačítko – popisek">
            <Input
              value={String((block.payload.cta_primary as { label?: string } | undefined)?.label ?? "")}
              onChange={(e) =>
                setField({
                  cta_primary: { ...(block.payload.cta_primary as object || {}), label: e.target.value },
                })
              }
            />
          </Field>
          <Field label="Hlavní tlačítko – odkaz (URL)">
            <Input
              value={String((block.payload.cta_primary as { href?: string } | undefined)?.href ?? "")}
              onChange={(e) =>
                setField({
                  cta_primary: { ...(block.payload.cta_primary as object || {}), href: e.target.value },
                })
              }
            />
          </Field>
        </div>
      );

    case "rich_text":
      return (
        <Field label="HTML obsah">
          <Textarea
            rows={10}
            value={String(block.payload.html ?? "")}
            onChange={(e) => setField({ html: e.target.value })}
            placeholder="<p>Odstavec…</p>"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Povolené je základní HTML. Skripty a iframe jsou serverem odstraňovány.
          </p>
        </Field>
      );

    case "section_heading":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Text nad titulkem">
            <Input value={String(block.payload.eyebrow ?? "")} onChange={(e) => setField({ eyebrow: e.target.value })} />
          </Field>
          <Field label="Nadpis">
            <Input value={String(block.payload.title ?? "")} onChange={(e) => setField({ title: e.target.value })} />
          </Field>
          <Field label="Popisek">
            <Input value={String(block.payload.description ?? "")} onChange={(e) => setField({ description: e.target.value })} />
          </Field>
          <Field label="Zarovnání">
            <Select value={String(block.payload.align ?? "left")} onValueChange={(v) => setField({ align: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Vlevo</SelectItem>
                <SelectItem value="center">Na střed</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      );

    case "single_image":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Fotografie">
            <PhotoPicker
              photos={photos}
              value={(block.payload.photo_id as string) ?? undefined}
              onChange={(ids) => setField({ photo_id: ids[0] ?? "" })}
            />
            <div className="mt-2">
              <PhotoChip photo={photoMap.get(block.payload.photo_id as string)} />
            </div>
          </Field>
          <Field label="Poměr stran">
            <Select value={String(block.payload.aspect ?? "auto")} onValueChange={(v) => setField({ aspect: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="portrait">Portrét</SelectItem>
                <SelectItem value="landscape">Krajina</SelectItem>
                <SelectItem value="square">Čtverec</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Popisek (volitelný)">
            <Input value={String(block.payload.caption ?? "")} onChange={(e) => setField({ caption: e.target.value })} />
          </Field>
        </div>
      );

    case "image_pair":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Fotka vlevo">
            <PhotoPicker
              photos={photos}
              value={(block.payload.left_photo_id as string) ?? undefined}
              onChange={(ids) => setField({ left_photo_id: ids[0] ?? "" })}
            />
            <div className="mt-2">
              <PhotoChip photo={photoMap.get(block.payload.left_photo_id as string)} />
            </div>
          </Field>
          <Field label="Fotka vpravo">
            <PhotoPicker
              photos={photos}
              value={(block.payload.right_photo_id as string) ?? undefined}
              onChange={(ids) => setField({ right_photo_id: ids[0] ?? "" })}
            />
            <div className="mt-2">
              <PhotoChip photo={photoMap.get(block.payload.right_photo_id as string)} />
            </div>
          </Field>
          <Field label="Popisek (volitelný)" className="md:col-span-2">
            <Input value={String(block.payload.caption ?? "")} onChange={(e) => setField({ caption: e.target.value })} />
          </Field>
        </div>
      );

    case "image_carousel":
    case "photo_grid":
    case "featured_photos":
      return (
        <div className="space-y-3">
          {block.block_type === "featured_photos" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Titulek">
                <Input value={String(block.payload.title ?? "")} onChange={(e) => setField({ title: e.target.value })} />
              </Field>
              <Field label="Odkaz „vidět více“">
                <Input
                  value={String(block.payload.view_all_href ?? "/galerie")}
                  onChange={(e) => setField({ view_all_href: e.target.value })}
                />
              </Field>
              <Field label="Popis" className="md:col-span-2">
                <Input
                  value={String(block.payload.description ?? "")}
                  onChange={(e) => setField({ description: e.target.value })}
                />
              </Field>
            </div>
          ) : null}
          {block.block_type === "photo_grid" ? (
            <Field label="Sloupce">
              <Select
                value={String(block.payload.columns ?? 3)}
                onValueChange={(v) => setField({ columns: Number(v) })}
              >
                <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          ) : null}

          <Field label="Vybrané fotky">
            <PhotoPicker
              photos={photos}
              multi
              values={(block.payload.photo_ids as string[]) ?? []}
              onChange={(ids) => setField({ photo_ids: ids })}
              label="Vybrat fotky"
            />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {((block.payload.photo_ids as string[]) ?? []).map((id) => (
                <PhotoChip
                  key={id}
                  photo={photoMap.get(id)}
                  onRemove={() =>
                    setField({
                      photo_ids: ((block.payload.photo_ids as string[]) ?? []).filter((x) => x !== id),
                    })
                  }
                />
              ))}
            </div>
          </Field>
          {block.block_type === "image_carousel" ? (
            <Field label="Popisek (volitelný)">
              <Input value={String(block.payload.caption ?? "")} onChange={(e) => setField({ caption: e.target.value })} />
            </Field>
          ) : null}
        </div>
      );

    case "quote":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Citace" className="md:col-span-2">
            <Textarea rows={3} value={String(block.payload.quote ?? "")} onChange={(e) => setField({ quote: e.target.value })} />
          </Field>
          <Field label="Autor">
            <Input value={String(block.payload.author ?? "")} onChange={(e) => setField({ author: e.target.value })} />
          </Field>
          <Field label="Kontext">
            <Input value={String(block.payload.context ?? "")} onChange={(e) => setField({ context: e.target.value })} />
          </Field>
        </div>
      );

    case "cta":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Titulek">
            <Input value={String(block.payload.title ?? "")} onChange={(e) => setField({ title: e.target.value })} />
          </Field>
          <Field label="Popis">
            <Input value={String(block.payload.description ?? "")} onChange={(e) => setField({ description: e.target.value })} />
          </Field>
          <Field label="Hlavní tlačítko – popisek">
            <Input
              value={String((block.payload.primary as { label?: string } | undefined)?.label ?? "")}
              onChange={(e) => setField({ primary: { ...(block.payload.primary as object || {}), label: e.target.value } })}
            />
          </Field>
          <Field label="Hlavní tlačítko – odkaz (URL)">
            <Input
              value={String((block.payload.primary as { href?: string } | undefined)?.href ?? "")}
              onChange={(e) => setField({ primary: { ...(block.payload.primary as object || {}), href: e.target.value } })}
            />
          </Field>
        </div>
      );

    case "faq":
      return (
        <FaqFields value={(block.payload.items as { question: string; answer: string }[]) ?? []} onChange={(items) => setField({ items })} />
      );

    case "story_intro":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Titulek">
            <Input value={String(block.payload.title ?? "")} onChange={(e) => setField({ title: e.target.value })} />
          </Field>
          <Field label="Podtitulek">
            <Input value={String(block.payload.subtitle ?? "")} onChange={(e) => setField({ subtitle: e.target.value })} />
          </Field>
          <Field label="Datum (ISO)">
            <Input
              type="date"
              value={String(block.payload.date ?? "").slice(0, 10)}
              onChange={(e) => setField({ date: e.target.value })}
            />
          </Field>
          <Field label="Cover fotografie">
            <PhotoPicker
              photos={photos}
              value={(block.payload.cover_photo_id as string) ?? undefined}
              onChange={(ids) => setField({ cover_photo_id: ids[0] ?? null })}
            />
            <div className="mt-2">
              <PhotoChip photo={photoMap.get(block.payload.cover_photo_id as string)} />
            </div>
          </Field>
        </div>
      );

    case "home_hero": {
      const primary = (block.payload.cta_primary as { label?: string; href?: string } | undefined) ?? {};
      const secondary = (block.payload.cta_secondary as { label?: string; href?: string } | undefined) ?? {};
      return (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Text nad titulkem">
              <Input value={String(block.payload.eyebrow ?? "")} onChange={(e) => setField({ eyebrow: e.target.value })} />
            </Field>
            <Field label="Auto-rotace (ms, 0 = vypnuto)">
              <Input
                type="number"
                min={0}
                max={60000}
                step={500}
                value={Number(block.payload.auto_rotate_ms ?? 5000)}
                onChange={(e) => setField({ auto_rotate_ms: Number(e.target.value) })}
              />
            </Field>
            <Field label="Titulek" className="md:col-span-2">
              <Input value={String(block.payload.title ?? "")} onChange={(e) => setField({ title: e.target.value })} />
            </Field>
            <Field label="Podtitulek" className="md:col-span-2">
              <Textarea rows={2} value={String(block.payload.subtitle ?? "")} onChange={(e) => setField({ subtitle: e.target.value })} />
            </Field>
            <Field label="Hlavní tlačítko – popisek">
              <Input value={primary.label ?? ""} onChange={(e) => setField({ cta_primary: { ...primary, label: e.target.value } })} />
            </Field>
            <Field label="Hlavní tlačítko – odkaz (URL)">
              <Input value={primary.href ?? ""} onChange={(e) => setField({ cta_primary: { ...primary, href: e.target.value } })} />
            </Field>
            <Field label="Vedlejší tlačítko – popisek">
              <Input value={secondary.label ?? ""} onChange={(e) => setField({ cta_secondary: { ...secondary, label: e.target.value } })} />
            </Field>
            <Field label="Vedlejší tlačítko – odkaz (URL)">
              <Input value={secondary.href ?? ""} onChange={(e) => setField({ cta_secondary: { ...secondary, href: e.target.value } })} />
            </Field>
          </div>
          <Field label="Fotky pro rotující carousel (prázdné = použít „Vybrané na hlavní stránku“ z nastavení)">
            <PhotoPicker
              photos={photos}
              multi
              values={(block.payload.photo_ids as string[]) ?? []}
              onChange={(ids) => setField({ photo_ids: ids })}
              label="Vybrat fotky"
            />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {((block.payload.photo_ids as string[]) ?? []).map((id) => (
                <PhotoChip
                  key={id}
                  photo={photoMap.get(id)}
                  onRemove={() =>
                    setField({
                      photo_ids: ((block.payload.photo_ids as string[]) ?? []).filter((x) => x !== id),
                    })
                  }
                />
              ))}
            </div>
          </Field>
        </div>
      );
    }

    case "home_about": {
      const paragraphs = (block.payload.paragraphs as string[]) ?? [""];
      return (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Text nad titulkem">
              <Input value={String(block.payload.eyebrow ?? "")} onChange={(e) => setField({ eyebrow: e.target.value })} />
            </Field>
            <Field label="Titulek">
              <Input value={String(block.payload.title ?? "")} onChange={(e) => setField({ title: e.target.value })} />
            </Field>
            <Field label="Text odkazu">
              <Input value={String(block.payload.link_label ?? "")} onChange={(e) => setField({ link_label: e.target.value })} />
            </Field>
            <Field label="URL odkazu">
              <Input value={String(block.payload.link_href ?? "")} onChange={(e) => setField({ link_href: e.target.value })} />
            </Field>
          </div>
          <div className="space-y-2">
            <Label>Odstavce</Label>
            {paragraphs.map((p, i) => (
              <div key={i} className="flex items-start gap-2">
                <Textarea
                  rows={3}
                  value={p}
                  onChange={(e) => {
                    const copy = [...paragraphs];
                    copy[i] = e.target.value;
                    setField({ paragraphs: copy });
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setField({ paragraphs: paragraphs.filter((_, j) => j !== i) })}
                  disabled={paragraphs.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => setField({ paragraphs: [...paragraphs, ""] })}
              disabled={paragraphs.length >= 6}
            >
              <Plus className="h-4 w-4" /> Přidat odstavec
            </Button>
          </div>
        </div>
      );
    }

    case "home_gallery_carousel": {
      const useFeatured = Boolean(block.payload.use_featured);
      return (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Text nad titulkem">
              <Input value={String(block.payload.eyebrow ?? "")} onChange={(e) => setField({ eyebrow: e.target.value })} />
            </Field>
            <Field label="Titulek">
              <Input value={String(block.payload.title ?? "")} onChange={(e) => setField({ title: e.target.value })} />
            </Field>
            <Field label="Text odkazu „vidět všechno“">
              <Input value={String(block.payload.view_all_label ?? "")} onChange={(e) => setField({ view_all_label: e.target.value })} />
            </Field>
            <Field label="URL odkazu „vidět všechno“">
              <Input value={String(block.payload.view_all_href ?? "")} onChange={(e) => setField({ view_all_href: e.target.value })} />
            </Field>
            <Field label="Layout">
              <Select
                value={String(block.payload.layout ?? "editorial")}
                onValueChange={(v) => setField({ layout: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="editorial">Editorial (1 velká + 2 menší)</SelectItem>
                  <SelectItem value="fade">Fade (jedna velká)</SelectItem>
                  <SelectItem value="strip">Pás náhledů (bez auto-rotace)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Auto-rotace (ms, 0 = vypnuto)">
              <Input
                type="number"
                min={0}
                max={60000}
                step={500}
                value={Number(block.payload.auto_rotate_ms ?? 5000)}
                onChange={(e) => setField({ auto_rotate_ms: Number(e.target.value) })}
              />
            </Field>
          </div>
          <div className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-3">
            <Checkbox
              id="use-featured"
              checked={useFeatured}
              onCheckedChange={(v) => setField({ use_featured: Boolean(v) })}
            />
            <div>
              <Label htmlFor="use-featured" className="font-normal">
                Použít fotky z nastavení „Vybrané na hlavní stránku“
              </Label>
              <p className="text-xs text-muted-foreground">
                Doporučeno – drží 1:1 synchronizaci s označením „Vybraná“ v galerii. Když vypneš, vybereš vlastní fotky níže.
              </p>
            </div>
          </div>
          {!useFeatured ? (
            <Field label="Vlastní výběr fotek">
              <PhotoPicker
                photos={photos}
                multi
                values={(block.payload.photo_ids as string[]) ?? []}
                onChange={(ids) => setField({ photo_ids: ids })}
                label="Vybrat fotky"
              />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {((block.payload.photo_ids as string[]) ?? []).map((id) => (
                  <PhotoChip
                    key={id}
                    photo={photoMap.get(id)}
                    onRemove={() =>
                      setField({
                        photo_ids: ((block.payload.photo_ids as string[]) ?? []).filter((x) => x !== id),
                      })
                    }
                  />
                ))}
              </div>
            </Field>
          ) : null}
        </div>
      );
    }

    case "home_service_cta": {
      const primary = (block.payload.cta_primary as { label?: string; href?: string } | undefined) ?? {};
      const secondary = (block.payload.cta_secondary as { label?: string; href?: string } | undefined) ?? {};
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Text nad titulkem">
            <Input value={String(block.payload.eyebrow ?? "")} onChange={(e) => setField({ eyebrow: e.target.value })} />
          </Field>
          <Field label="Pozadí">
            <Select
              value={String(block.payload.background ?? "muted")}
              onValueChange={(v) => setField({ background: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="muted">Šedivé (ztmavené)</SelectItem>
                <SelectItem value="plain">Čisté (jako stránka)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Titulek" className="md:col-span-2">
            <Input value={String(block.payload.title ?? "")} onChange={(e) => setField({ title: e.target.value })} />
          </Field>
          <Field label="Popis" className="md:col-span-2">
            <Textarea rows={2} value={String(block.payload.description ?? "")} onChange={(e) => setField({ description: e.target.value })} />
          </Field>
          <Field label="Hlavní tlačítko – popisek">
            <Input value={primary.label ?? ""} onChange={(e) => setField({ cta_primary: { ...primary, label: e.target.value } })} />
          </Field>
          <Field label="Hlavní tlačítko – odkaz (URL)">
            <Input value={primary.href ?? ""} onChange={(e) => setField({ cta_primary: { ...primary, href: e.target.value } })} />
          </Field>
          <Field label="Vedlejší tlačítko – popisek">
            <Input value={secondary.label ?? ""} onChange={(e) => setField({ cta_secondary: { ...secondary, label: e.target.value } })} />
          </Field>
          <Field label="Vedlejší tlačítko – odkaz (URL)">
            <Input value={secondary.href ?? ""} onChange={(e) => setField({ cta_secondary: { ...secondary, href: e.target.value } })} />
          </Field>
        </div>
      );
    }

    case "home_stories_feed":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Text nad titulkem">
            <Input value={String(block.payload.eyebrow ?? "")} onChange={(e) => setField({ eyebrow: e.target.value })} />
          </Field>
          <Field label="Titulek">
            <Input value={String(block.payload.title ?? "")} onChange={(e) => setField({ title: e.target.value })} />
          </Field>
          <Field label="Text odkazu">
            <Input value={String(block.payload.view_all_label ?? "")} onChange={(e) => setField({ view_all_label: e.target.value })} />
          </Field>
          <Field label="URL odkazu">
            <Input value={String(block.payload.view_all_href ?? "")} onChange={(e) => setField({ view_all_href: e.target.value })} />
          </Field>
          <Field label="Počet příběhů">
            <Input
              type="number"
              min={1}
              max={12}
              value={Number(block.payload.count ?? 3)}
              onChange={(e) => setField({ count: Number(e.target.value) })}
            />
          </Field>
        </div>
      );
  }
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function FaqFields({
  value,
  onChange,
}: {
  value: { question: string; answer: string }[];
  onChange: (items: { question: string; answer: string }[]) => void;
}) {
  return (
    <div className="space-y-3">
      {value.map((item, i) => (
        <div key={i} className="rounded-md border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-2">
            <Label>Položka {i + 1}</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
            >
              <Trash2 className="h-4 w-4" /> Odebrat
            </Button>
          </div>
          <div className="mt-2 space-y-2">
            <Input
              placeholder="Otázka"
              value={item.question}
              onChange={(e) => {
                const copy = [...value];
                copy[i] = { ...item, question: e.target.value };
                onChange(copy);
              }}
            />
            <Textarea
              placeholder="Odpověď"
              rows={3}
              value={item.answer}
              onChange={(e) => {
                const copy = [...value];
                copy[i] = { ...item, answer: e.target.value };
                onChange(copy);
              }}
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...value, { question: "", answer: "" }])}
      >
        <Plus className="h-4 w-4" /> Přidat FAQ položku
      </Button>
    </div>
  );
}
