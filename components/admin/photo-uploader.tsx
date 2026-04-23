"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cldUrl } from "@/lib/cloudinary-url";
import { upsertPhotoAction } from "@/features/photos/actions";
import type { Tag } from "@/types/database";

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic"];

interface PhotoUploaderProps {
  availableTags: Tag[];
  triggerLabel?: string;
  autoOpen?: boolean;
}

interface UploadedMeta {
  public_id: string;
  original_filename: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
}

export function PhotoUploader({ availableTags, triggerLabel = "Nahrát fotku", autoOpen = false }: PhotoUploaderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(autoOpen);
  const [stage, setStage] = useState<"pick" | "uploading" | "meta">("pick");
  const [uploaded, setUploaded] = useState<UploadedMeta | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [altText, setAltText] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "hidden">("public");
  const [featured, setFeatured] = useState(false);
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  function reset() {
    setStage("pick");
    setUploaded(null);
    setDisplayName("");
    setAltText("");
    setDescription("");
    setVisibility("public");
    setFeatured(false);
    setSelectedTagSlugs([]);
    setNewTagInput("");
    setNewTags([]);
  }

  async function handleFile(file: File) {
    if (!ALLOWED.includes(file.type)) {
      toast.error("Nepodporovaný formát. Povoleny: JPG, PNG, WebP, AVIF, HEIC.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Soubor je příliš velký (max 20 MB).");
      return;
    }

    setStage("uploading");

    try {
      // 1) získej podpis
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!signRes.ok) throw new Error("Nepodařilo se získat podpis");
      const sign = (await signRes.json()) as {
        signature: string;
        timestamp: number;
        apiKey: string;
        cloudName: string;
        folder: string;
      };

      // 2) upload přímo do Cloudinary
      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", sign.apiKey);
      fd.append("timestamp", String(sign.timestamp));
      fd.append("signature", sign.signature);
      fd.append("folder", sign.folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
        { method: "POST", body: fd },
      );
      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        throw new Error(err || "Upload selhal");
      }
      const data = (await uploadRes.json()) as {
        public_id: string;
        original_filename: string;
        width: number;
        height: number;
        bytes: number;
        format: string;
      };
      setUploaded(data);
      setDisplayName(
        (data.original_filename || "")
          .replace(/[-_]+/g, " ")
          .replace(/\s+/g, " ")
          .replace(/^./, (c) => c.toUpperCase()),
      );
      setStage("meta");
    } catch (err) {
      console.error(err);
      toast.error("Nahrání selhalo. Zkuste to znovu.");
      setStage("pick");
    }
  }

  async function save() {
    if (!uploaded) return;
    setSaving(true);
    try {
      await upsertPhotoAction({
        cloudinary_public_id: uploaded.public_id,
        original_filename: uploaded.original_filename,
        display_name: displayName.trim() || uploaded.original_filename,
        alt_text: altText,
        description: description.trim() || null,
        visibility,
        is_featured_home: featured,
        width: uploaded.width,
        height: uploaded.height,
        bytes: uploaded.bytes,
        format: uploaded.format,
        tag_slugs: selectedTagSlugs,
        new_tag_names: newTags,
      });
      toast.success("Fotka uložena.");
      reset();
      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Uložení selhalo.");
    } finally {
      setSaving(false);
    }
  }

  function addNewTag() {
    const v = newTagInput.trim();
    if (!v) return;
    if (newTags.includes(v)) return;
    setNewTags((t) => [...t, v]);
    setNewTagInput("");
  }

  function toggleTag(slug: string) {
    setSelectedTagSlugs((arr) => (arr.includes(slug) ? arr.filter((s) => s !== slug) : [...arr, slug]));
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4" />
        {triggerLabel}
      </Button>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nahrát fotku</DialogTitle>
            <DialogDescription>
              Jedna fotka. Po nahrání vyplníte metadata. Originál se nepřepisuje.
            </DialogDescription>
          </DialogHeader>

          {stage === "pick" && (
            <DropZone onFile={handleFile} />
          )}

          {stage === "uploading" && (
            <div className="flex items-center gap-3 rounded-md border border-dashed border-border bg-muted/40 p-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              <p className="text-sm">Nahrávám do Cloudinary…</p>
            </div>
          )}

          {stage === "meta" && uploaded ? (
            <div className="grid gap-5 md:grid-cols-[180px_1fr]">
              <div className="space-y-2">
                <div className="overflow-hidden rounded-md bg-muted">
                  <img
                    src={cldUrl(uploaded.public_id, { width: 360, crop: "fill", gravity: "auto" })}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <div className="p-2 text-xs text-muted-foreground">
                    {uploaded.width}×{uploaded.height} · {(uploaded.bytes / 1024).toFixed(0)} kB · {uploaded.format}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => replaceInputRef.current?.click()}
                  disabled={saving}
                >
                  <RefreshCw className="h-4 w-4" /> Změnit fotku
                </Button>
                <input
                  ref={replaceInputRef}
                  type="file"
                  accept={ALLOWED.join(",")}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) handleFile(f);
                  }}
                />
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="display_name">Název</Label>
                  <Input id="display_name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="alt_text">Alternativní text (pro přístupnost)</Label>
                  <Input id="alt_text" value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Např. Hnědý valach v ranní mlze" />
                </div>
                <div>
                  <Label htmlFor="description">Popis (volitelný)</Label>
                  <Textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Viditelnost</Label>
                    <Select value={visibility} onValueChange={(v) => setVisibility(v as "public" | "hidden")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Veřejná</SelectItem>
                        <SelectItem value="hidden">Skrytá</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-3">
                    <Checkbox id="featured" checked={featured} onCheckedChange={(v) => setFeatured(v === true)} />
                    <Label htmlFor="featured" className="font-normal">Vybraná na hlavní stránku</Label>
                  </div>
                </div>

                <div>
                  <Label>Tagy</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {availableTags.map((t) => {
                      const on = selectedTagSlugs.includes(t.slug);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleTag(t.slug)}
                          className={`rounded-full border px-3 py-1 text-xs transition-colors ${on ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:border-foreground"}`}
                        >
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Input
                      placeholder="Nový tag…"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addNewTag();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addNewTag}>
                      Přidat
                    </Button>
                  </div>
                  {newTags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {newTags.map((n) => (
                        <Badge key={n} variant="accent">
                          {n}
                          <button
                            type="button"
                            className="ml-2"
                            onClick={() => setNewTags((arr) => arr.filter((v) => v !== n))}
                            aria-label={`Odebrat ${n}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            {stage === "meta" ? (
              <>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Zrušit</Button>
                <Button variant="primary" onClick={save} disabled={saving || !displayName.trim()}>
                  {saving ? "Ukládám…" : (<><CheckCircle2 className="h-4 w-4" /> Uložit</>)}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setOpen(false)}>Zavřít</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DropZone({ onFile }: { onFile: (f: File) => void }) {
  const [dragging, setDragging] = useState(false);
  return (
    <label
      className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-10 text-center transition-colors ${dragging ? "border-foreground bg-muted" : "border-border bg-muted/30 hover:bg-muted/50"}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
    >
      <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
      <p className="font-serif text-xl">Přetáhněte fotku nebo vyberte</p>
      <p className="mt-1 text-sm text-muted-foreground">JPG / PNG / WebP / AVIF / HEIC · max 20 MB</p>
      <input
        type="file"
        accept={ALLOWED.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
        <AlertCircle className="h-3.5 w-3.5" />
        Nepoužívejte soubory s osobními metadaty (GPS). Cloudinary EXIF/GPS při transformaci nepropisuje.
      </div>
    </label>
  );
}
