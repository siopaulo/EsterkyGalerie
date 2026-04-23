"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { PhotoPicker, PhotoChip, type PhotoLite } from "@/components/admin/photo-picker";
import { BlockEditor, type BlockDraft } from "@/components/admin/block-editor";
import { slugify } from "@/lib/slug";
import {
  upsertStoryAction,
  saveStoryBlocksAction,
  deleteStoryAction,
} from "@/features/stories/actions";
import type { Story, StoryBlock, Tag } from "@/types/database";
import { NON_HOME_BLOCK_TYPES, type BlockType } from "@/features/blocks/schemas";

interface StoryEditorProps {
  story: Story;
  blocks: StoryBlock[];
  initialTagSlugs: string[];
  availableTags: Tag[];
  availablePhotos: PhotoLite[];
}

export function StoryEditor({
  story,
  blocks: initialBlocks,
  initialTagSlugs,
  availableTags,
  availablePhotos,
}: StoryEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(story.title);
  const [slug, setSlug] = useState(story.slug);
  const [excerpt, setExcerpt] = useState(story.excerpt ?? "");
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(story.cover_photo_id);
  const [publishedAt, setPublishedAt] = useState(story.published_at.slice(0, 16));
  const [seoTitle, setSeoTitle] = useState(story.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(story.seo_description ?? "");
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>(initialTagSlugs);
  const [newTagInput, setNewTagInput] = useState("");
  const [blocks, setBlocks] = useState<BlockDraft[]>(
    initialBlocks.map((b) => ({
      id: b.id,
      block_type: b.block_type as BlockType,
      payload: (b.payload as Record<string, unknown>) ?? {},
    })),
  );
  const [, startTransition] = useTransition();

  const photoMap = new Map(availablePhotos.map((p) => [p.id, p]));

  function toggleTag(s: string) {
    setSelectedTagSlugs((arr) => (arr.includes(s) ? arr.filter((x) => x !== s) : [...arr, s]));
  }

  async function saveAll() {
    try {
      const finalSlug = slug || slugify(title);
      await upsertStoryAction({
        id: story.id,
        title,
        slug: finalSlug,
        excerpt: excerpt || null,
        cover_photo_id: coverPhotoId,
        published_at: new Date(publishedAt).toISOString(),
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        tag_slugs: selectedTagSlugs,
      });
      await saveStoryBlocksAction(story.id, blocks);
      toast.success("Příběh uložen.");
      startTransition(() => router.refresh());
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || "Uložení selhalo.");
    }
  }

  async function onDelete() {
    try {
      await deleteStoryAction(story.id);
      toast.success("Příběh smazán.");
      router.push("/studio/pribehy");
    } catch (err) {
      console.error(err);
      toast.error("Smazání selhalo.");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-8">
        <div className="rounded-lg border border-border bg-background p-6">
          <h2 className="font-serif text-xl">Metadata</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="t">Název</Label>
              <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="s">Slug</Label>
              <Input
                id="s"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="automaticky z názvu"
              />
            </div>
            <div>
              <Label htmlFor="d">Datum publikace</Label>
              <Input
                id="d"
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="ex">Výtah (excerpt)</Label>
              <Textarea
                id="ex"
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Krátký shrnující text pro výpisy a sdílení."
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-6">
          <h2 className="font-serif text-xl">Obsah příběhu</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Skládání modulů. Řazení tlačítky nahoru/dolů. Odkazy na smazané fotky vykreslí placeholder.
          </p>
          <div className="mt-6">
            <BlockEditor
              value={blocks}
              onChange={setBlocks}
              photos={availablePhotos}
              allowedTypes={NON_HOME_BLOCK_TYPES}
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-6">
          <h2 className="font-serif text-xl">SEO</h2>
          <div className="mt-4 grid gap-4">
            <div>
              <Label htmlFor="st">SEO titulek</Label>
              <Input id="st" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="sd">SEO popisek</Label>
              <Textarea id="sd" rows={3} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <aside className="space-y-6">
        <div className="sticky top-6 rounded-lg border border-border bg-background p-6">
          <Button onClick={saveAll} className="w-full" variant="primary">
            <Save className="h-4 w-4" /> Uložit vše
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" className="mt-3 w-full">
                <Trash2 className="h-4 w-4" /> Smazat příběh
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Smazat příběh?</AlertDialogTitle>
                <AlertDialogDescription>
                  Příběh bude odstraněn včetně všech modulů. Fotky zůstanou v galerii –
                  smazat je můžete individuálně v galerii.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Zrušit</AlertDialogCancel>
                <AlertDialogAction className="bg-red-700 text-white hover:bg-red-800" onClick={onDelete}>
                  Smazat
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="rounded-lg border border-border bg-background p-6">
          <Label>Cover fotografie</Label>
          <div className="mt-2 flex items-center gap-2">
            <PhotoPicker
              photos={availablePhotos}
              value={coverPhotoId ?? undefined}
              onChange={(ids) => setCoverPhotoId(ids[0] ?? null)}
              label={coverPhotoId ? "Změnit" : "Vybrat"}
            />
            {coverPhotoId ? (
              <Button variant="ghost" size="sm" onClick={() => setCoverPhotoId(null)}>
                Odebrat
              </Button>
            ) : null}
          </div>
          <div className="mt-3">
            <PhotoChip photo={coverPhotoId ? photoMap.get(coverPhotoId) : undefined} />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-6">
          <Label>Tagy</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {availableTags.map((t) => {
              const on = selectedTagSlugs.includes(t.slug);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTag(t.slug)}
                  className={`rounded-full border px-3 py-1 text-xs ${on ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}
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
                  const s = slugify(newTagInput);
                  if (s && !selectedTagSlugs.includes(s)) {
                    setSelectedTagSlugs((arr) => [...arr, s]);
                  }
                  setNewTagInput("");
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const s = slugify(newTagInput);
                if (s && !selectedTagSlugs.includes(s)) {
                  setSelectedTagSlugs((arr) => [...arr, s]);
                }
                setNewTagInput("");
              }}
            >
              Přidat
            </Button>
          </div>
          {selectedTagSlugs.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedTagSlugs.map((s) => {
                const known = availableTags.find((t) => t.slug === s);
                return (
                  <Badge key={s} variant="accent">
                    {known?.name ?? s}
                  </Badge>
                );
              })}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
