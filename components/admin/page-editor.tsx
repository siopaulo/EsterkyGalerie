"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BlockEditor, type BlockDraft } from "@/components/admin/block-editor";
import { updatePageMetaAction, savePageBlocksAction } from "@/features/pages/actions";
import type { Page, PageBlock } from "@/types/database";
import { HOME_BLOCK_TYPES, NON_HOME_BLOCK_TYPES, type BlockType } from "@/features/blocks/schemas";
import type { PhotoLite } from "@/components/admin/photo-picker";

interface PageEditorProps {
  page: Page;
  blocks: PageBlock[];
  availablePhotos: PhotoLite[];
}

export function PageEditor({ page, blocks: initialBlocks, availablePhotos }: PageEditorProps) {
  const isHome = page.slug === "_home";
  const router = useRouter();
  const [title, setTitle] = useState(page.title);
  const [intro, setIntro] = useState(page.intro ?? "");
  const [seoTitle, setSeoTitle] = useState(page.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(page.seo_description ?? "");
  const [blocks, setBlocks] = useState<BlockDraft[]>(
    initialBlocks.map((b) => ({
      id: b.id,
      block_type: b.block_type as BlockType,
      payload: (b.payload as Record<string, unknown>) ?? {},
    })),
  );

  async function save() {
    try {
      await updatePageMetaAction({
        id: page.id,
        title,
        intro: intro || null,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
      });
      await savePageBlocksAction(page.id, blocks);
      toast.success("Stránka uložena.");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || "Uložení selhalo.");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-8">
        {!isHome ? (
          <div className="rounded-lg border border-border bg-background p-6">
            <h2 className="font-serif text-xl">Metadata</h2>
            <div className="mt-4 grid gap-4">
              <div>
                <Label htmlFor="t">Název</Label>
                <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="intro">Úvodní text</Label>
                <Textarea id="intro" rows={3} value={intro} onChange={(e) => setIntro(e.target.value)} />
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-lg border border-border bg-background p-6">
          <h2 className="font-serif text-xl">
            {isHome ? "Moduly homepage" : "Moduly obsahu"}
          </h2>
          {isHome ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Skládej si hlavní stránku z modulů – úvodní sekce s carouselem, text o autorce, galerie, sekce s tlačítkem, nejnovější příběhy.
              Pořadí můžeš měnit šipkami. Prázdné nebo smazané se jednoduše skryje.
            </p>
          ) : null}
          <div className="mt-6">
            <BlockEditor
              value={blocks}
              onChange={setBlocks}
              photos={availablePhotos}
              allowedTypes={isHome ? HOME_BLOCK_TYPES : NON_HOME_BLOCK_TYPES}
            />
          </div>
        </div>

        {!isHome ? (
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
        ) : null}
      </div>

      <aside>
        <div className="sticky top-6 rounded-lg border border-border bg-background p-6">
          <Button onClick={save} className="w-full" variant="primary">
            <Save className="h-4 w-4" /> {isHome ? "Uložit homepage" : "Uložit stránku"}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            {isHome
              ? "Po uložení se změny projeví na hlavní stránce (/)."
              : `Stránka „${page.slug}“ se po uložení propíše i na veřejný web.`}
          </p>
        </div>
      </aside>
    </div>
  );
}
