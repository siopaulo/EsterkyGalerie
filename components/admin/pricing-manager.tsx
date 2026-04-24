"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { upsertPricingItemAction, deletePricingItemAction } from "@/features/pricing/actions";
import type { PricingItem } from "@/types/database";

export function PricingManager({ initial }: { initial: PricingItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);

  async function save(item: PricingItem) {
    try {
      await upsertPricingItemAction({
        id: item.id.startsWith("new-") ? undefined : item.id,
        section: item.section,
        title: item.title,
        description: item.description,
        price_label: item.price_label,
        features: item.features,
        sort_order: item.sort_order,
      });
      toast.success("Uloženo.");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function remove(id: string) {
    if (id.startsWith("new-")) {
      setItems((arr) => arr.filter((i) => i.id !== id));
      return;
    }
    try {
      await deletePricingItemAction(id);
      setItems((arr) => arr.filter((i) => i.id !== id));
      toast.success("Smazáno.");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  function add() {
    const id = `new-${crypto.randomUUID()}`;
    setItems((arr) => [
      ...arr,
      {
        id,
        section: "balicky",
        title: "Nový balíček",
        description: null,
        price_label: "",
        features: [],
        sort_order: arr.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  }

  return (
    <div className="space-y-6">
      <Button variant="primary" onClick={add}>
        <Plus className="h-4 w-4" /> Přidat položku
      </Button>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Zatím žádné položky ceníku.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item, idx) => (
            <PricingRow
              key={item.id}
              item={item}
              onChange={(next) => setItems((arr) => arr.map((x, i) => (i === idx ? next : x)))}
              onSave={save}
              onDelete={() => remove(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PricingRow({
  item,
  onChange,
  onSave,
  onDelete,
}: {
  item: PricingItem;
  onChange: (i: PricingItem) => void;
  onSave: (i: PricingItem) => void | Promise<void>;
  onDelete: () => void | Promise<void>;
}) {
  const [featureInput, setFeatureInput] = useState("");
  const isDraft = item.id.startsWith("new-");
  function set(patch: Partial<PricingItem>) {
    onChange({ ...item, ...patch });
  }
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Sekce</Label>
          <select
            value={item.section}
            onChange={(e) => set({ section: e.target.value })}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="balicky">Balíčky</option>
            <option value="doplnky">Doplňky</option>
            <option value="default">Další</option>
          </select>
        </div>
        <div>
          <Label>Pořadí</Label>
          <Input
            type="number"
            value={item.sort_order}
            onChange={(e) => set({ sort_order: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="md:col-span-2">
          <Label>Název</Label>
          <Input value={item.title} onChange={(e) => set({ title: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Label>Popis</Label>
          <Textarea rows={2} value={item.description ?? ""} onChange={(e) => set({ description: e.target.value })} />
        </div>
        <div>
          <Label>Cena (text)</Label>
          <Input value={item.price_label ?? ""} onChange={(e) => set({ price_label: e.target.value })} placeholder="od 3 500 Kč" />
        </div>
        <div>
          <Label>Výhody (odrážky)</Label>
          <div className="flex max-w-full flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Např. 30 upravených fotek"
              className="min-w-0 flex-1"
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const v = featureInput.trim();
                  if (v) {
                    set({ features: [...item.features, v] });
                    setFeatureInput("");
                  }
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const v = featureInput.trim();
                if (v) {
                  set({ features: [...item.features, v] });
                  setFeatureInput("");
                }
              }}
            >
              Přidat
            </Button>
          </div>
          {item.features.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {item.features.map((f, i) => (
                <li key={i} className="flex items-center justify-between rounded-md bg-muted px-3 py-1 text-sm">
                  {f}
                  <button
                    type="button"
                    onClick={() => set({ features: item.features.filter((_, j) => j !== i) })}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Odebrat"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {isDraft ? (
          <Button variant="ghost" className="text-red-700" onClick={onDelete}>
            <Trash2 className="h-4 w-4" /> Zahodit
          </Button>
        ) : (
          <ConfirmDialog
            title="Opravdu smazat tuto položku ceníku?"
            description="Tuto akci nelze vrátit zpět. Položka bude trvale odstraněna z ceníku."
            onConfirm={onDelete}
          >
            <Button variant="ghost" className="text-red-700">
              <Trash2 className="h-4 w-4" /> Smazat
            </Button>
          </ConfirmDialog>
        )}
        <Button variant="primary" onClick={() => onSave(item)}>
          <Save className="h-4 w-4" /> Uložit
        </Button>
      </div>
    </div>
  );
}
