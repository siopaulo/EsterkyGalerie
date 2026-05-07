"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { upsertTagAction, deleteTagAction } from "@/features/tags/actions";
import type { Tag } from "@/types/database";

export function TagsManager({ initialTags }: { initialTags: Tag[] }) {
  const router = useRouter();
  const [tags, setTags] = useState(initialTags);
  const [newName, setNewName] = useState("");

  async function add() {
    const name = newName.trim();
    if (!name) return;
    try {
      await upsertTagAction({ name });
      setNewName("");
      toast.success("Tag přidán.");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function rename(id: string, name: string) {
    try {
      await upsertTagAction({ id, name });
      toast.success("Upraveno.");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function remove(id: string) {
    try {
      await deleteTagAction(id);
      setTags((arr) => arr.filter((t) => t.id !== id));
      toast.success("Tag smazán.");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Nový tag…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="min-w-0 flex-1"
        />
        <Button variant="primary" onClick={add} className="sm:w-auto">
          <Plus className="h-4 w-4" /> Přidat
        </Button>
      </div>

      {tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">Zatím žádné tagy.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-background">
          {tags.map((t) => (
            <TagRow key={t.id} tag={t} onSave={rename} onDelete={remove} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TagRow({
  tag,
  onSave,
  onDelete,
}: {
  tag: Tag;
  onSave: (id: string, name: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}) {
  const [name, setName] = useState(tag.name);
  const dirty = name !== tag.name;
  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-w-0 sm:max-w-sm"
        />
        <span className="text-xs text-muted-foreground sm:whitespace-nowrap">/{tag.slug}</span>
      </div>
      <div className="flex items-center justify-end gap-2">
        {dirty ? (
          <Button variant="outline" size="sm" onClick={() => onSave(tag.id, name)}>
            <Save className="h-4 w-4" /> Uložit
          </Button>
        ) : null}
        <ConfirmDialog
          title={`Opravdu smazat tag „${tag.name}"?`}
          description="Tag bude odstraněn ze všech navázaných fotografií a příběhů. Samotné fotografie zůstanou nedotčené."
          onConfirm={() => onDelete(tag.id)}
        >
          <Button variant="ghost" size="sm" className="text-red-700" aria-label={`Smazat tag ${tag.name}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </ConfirmDialog>
      </div>
    </li>
  );
}
