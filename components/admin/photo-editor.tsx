"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { upsertPhotoAction, softDeletePhotoAction } from "@/features/photos/actions";
import type { Photo, Tag } from "@/types/database";

interface PhotoEditorProps {
  photo: Photo;
  initialTagSlugs: string[];
  availableTags: Tag[];
  usage: { total: number; asCover: number; inStoryBlocks: number; inPageBlocks: number; inFeatured?: number };
}

export function PhotoEditor({ photo, initialTagSlugs, availableTags, usage }: PhotoEditorProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(photo.display_name);
  const [altText, setAltText] = useState(photo.alt_text);
  const [description, setDescription] = useState(photo.description ?? "");
  const [visibility, setVisibility] = useState<"public" | "hidden">(photo.visibility);
  const [featured, setFeatured] = useState(photo.is_featured_home);
  const [selected, setSelected] = useState(initialTagSlugs);
  const [newTagInput, setNewTagInput] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [deleteFromCloudinary, setDeleteFromCloudinary] = useState(usage.total === 0);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [, startTransition] = useTransition();

  function toggle(slug: string) {
    setSelected((arr) => (arr.includes(slug) ? arr.filter((s) => s !== slug) : [...arr, slug]));
  }

  function addTag() {
    const v = newTagInput.trim();
    if (!v || newTags.includes(v)) return;
    setNewTags((t) => [...t, v]);
    setNewTagInput("");
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      await upsertPhotoAction({
        id: photo.id,
        cloudinary_public_id: photo.cloudinary_public_id,
        display_name: displayName.trim() || photo.display_name,
        alt_text: altText,
        description: description.trim() || null,
        visibility,
        is_featured_home: featured,
        tag_slugs: selected,
        new_tag_names: newTags,
      });
      setNewTags([]);
      setNewTagInput("");
      toast.success("Uloženo.");
      startTransition(() => router.refresh());
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Uložení selhalo.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      await softDeletePhotoAction(photo.id, deleteFromCloudinary);
      toast.success("Fotka smazána.");
      router.push("/studio/galerie");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Smazání selhalo.");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5 rounded-lg border border-border bg-background p-5">
      <div>
        <Label htmlFor="dn">Název</Label>
        <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="alt">Alt text</Label>
        <Input id="alt" value={altText} onChange={(e) => setAltText(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="desc">Popis</Label>
        <Textarea id="desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
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
          <Checkbox id="feat" checked={featured} onCheckedChange={(v) => setFeatured(v === true)} />
          <Label htmlFor="feat" className="font-normal">Vybraná na hlavní stránku</Label>
        </div>
      </div>

      <div>
        <Label>Tagy</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {availableTags.map((t) => {
            const on = selected.includes(t.slug);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggle(t.slug)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${on ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:border-foreground"}`}
              >
                {t.name}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="Nový tag…"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addTag}>Přidat</Button>
        </div>
        {newTags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {newTags.map((n) => (
              <Badge key={n} variant="accent">
                {n}
                <button className="ml-2" onClick={() => setNewTags((arr) => arr.filter((v) => v !== n))}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive">
              <Trash2 className="h-4 w-4" /> Smazat
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Smazat fotku?</AlertDialogTitle>
              <AlertDialogDescription>
                Fotka bude skryta z webu (soft-delete).
                {usage.total > 0 ? (
                  <>
                    <br /><strong>Pozor:</strong> fotka je používaná ({usage.total}×). Ve webu se místo ní zobrazí placeholder.
                  </>
                ) : (
                  <> Můžete zvolit, zda smazat i originál z Cloudinary.</>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {usage.total === 0 ? (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={deleteFromCloudinary}
                  onCheckedChange={(v) => setDeleteFromCloudinary(v === true)}
                />
                <span>Smazat i z Cloudinary</span>
              </label>
            ) : null}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Zrušit</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-700 text-white hover:bg-red-800"
                onClick={onDelete}
                disabled={deleting}
              >
                {deleting ? "Mažu…" : "Smazat"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button type="button" variant="primary" onClick={save} disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? "Ukládám…" : "Uložit změny"}
        </Button>
      </div>
    </div>
  );
}
