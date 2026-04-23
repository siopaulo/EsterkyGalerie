"use client";

import Link from "next/link";
import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  EyeOff,
  Pencil,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { StarRating } from "@/components/public/star-rating";
import { formatDateCs, cn } from "@/lib/utils";
import {
  deleteReviewAction,
  setReviewApprovedAction,
  updateReviewAction,
} from "@/features/reviews/actions";
import type { Review } from "@/types/database";

interface Filters {
  status: "all" | "pending" | "approved";
  sort: "newest" | "oldest" | "best" | "worst";
  rating?: number;
}

interface ReviewsTableProps {
  rows: Review[];
  total: number;
  pending: number;
  approved: number;
  filters: Filters;
}

export function ReviewsTable({ rows, total, pending, approved, filters }: ReviewsTableProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Review>>({});
  const [, startTransition] = useTransition();

  function goToFilter(next: Partial<Filters>) {
    const params = new URLSearchParams();
    const merged: Filters = { ...filters, ...next };
    if (merged.status !== "all") params.set("status", merged.status);
    if (merged.sort !== "newest") params.set("sort", merged.sort);
    if (merged.rating && merged.rating >= 1 && merged.rating <= 5) {
      params.set("rating", String(merged.rating));
    }
    const qs = params.toString();
    router.push(qs ? `/studio/recenze?${qs}` : "/studio/recenze");
  }

  async function onApprove(id: string, approved: boolean) {
    try {
      await setReviewApprovedAction(id, approved);
      toast.success(approved ? "Recenze zveřejněna." : "Recenze skryta.");
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteReviewAction(id);
      toast.success("Recenze smazána.");
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  function startEdit(r: Review) {
    setEditingId(r.id);
    setDraft({
      name: r.name ?? "",
      message: r.message ?? "",
      rating: r.rating,
      approved: r.approved,
    });
  }

  async function saveEdit(id: string) {
    try {
      await updateReviewAction({
        id,
        name: (draft.name ?? "") || null,
        message: (draft.message ?? "") || null,
        rating: Number(draft.rating ?? 5),
        approved: Boolean(draft.approved),
      });
      toast.success("Uloženo.");
      setEditingId(null);
      setDraft({});
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <FilterPill
            active={filters.status === "all"}
            onClick={() => goToFilter({ status: "all" })}
          >
            Vše <span className="ml-1 text-muted-foreground">{total}</span>
          </FilterPill>
          <FilterPill
            active={filters.status === "pending"}
            tone="accent"
            onClick={() => goToFilter({ status: "pending" })}
          >
            Ke schválení <span className="ml-1 text-muted-foreground">{pending}</span>
          </FilterPill>
          <FilterPill
            active={filters.status === "approved"}
            onClick={() => goToFilter({ status: "approved" })}
          >
            Schválené <span className="ml-1 text-muted-foreground">{approved}</span>
          </FilterPill>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            Hvězdičky
            <select
              value={filters.rating ?? ""}
              onChange={(e) =>
                goToFilter({
                  rating: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="h-9 rounded-md border border-border bg-background px-2 text-sm"
            >
              <option value="">všechny</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} ★
                </option>
              ))}
            </select>
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            Řazení
            <select
              value={filters.sort}
              onChange={(e) => goToFilter({ sort: e.target.value as Filters["sort"] })}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm"
            >
              <option value="newest">Nejnovější</option>
              <option value="oldest">Nejstarší</option>
              <option value="best">Nejlepší hodnocení</option>
              <option value="worst">Nejhorší hodnocení</option>
            </select>
          </label>
          <Button asChild variant="outline" size="sm">
            <Link href="/reference" target="_blank" prefetch={false}>
              Otevřít veřejnou stránku
            </Link>
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
          <p className="font-serif text-2xl">Žádné recenze</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Podle zvoleného filtru se nic nenašlo.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-background">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Stav</th>
                <th className="px-5 py-3">Autor</th>
                <th className="px-5 py-3">Hodnocení</th>
                <th className="px-5 py-3">Text</th>
                <th className="px-5 py-3">Datum</th>
                <th className="px-5 py-3 text-right">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => {
                const editing = editingId === r.id;
                return (
                  <Fragment key={r.id}>
                    <tr className="align-top">
                      <td className="px-5 py-3">
                        {r.approved ? (
                          <Badge variant="muted">Schváleno</Badge>
                        ) : (
                          <Badge variant="accent">Čeká</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {editing ? (
                          <Input
                            value={String(draft.name ?? "")}
                            placeholder="Anonym"
                            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                          />
                        ) : (
                          <span className="font-medium">
                            {r.name?.trim() ? r.name : <span className="text-muted-foreground">Anonym</span>}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {editing ? (
                          <StarRating
                            value={Number(draft.rating ?? r.rating)}
                            onChange={(v) => setDraft((d) => ({ ...d, rating: v }))}
                            size={18}
                          />
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium">
                            {r.rating}
                            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 max-w-md">
                        {editing ? (
                          <Textarea
                            rows={3}
                            value={String(draft.message ?? "")}
                            onChange={(e) => setDraft((d) => ({ ...d, message: e.target.value }))}
                          />
                        ) : r.message?.trim() ? (
                          <p className="text-sm text-muted-foreground line-clamp-3">{r.message}</p>
                        ) : (
                          <span className="text-xs text-muted-foreground">— bez textu —</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDateCs(r.created_at)}
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {editing ? (
                          <div className="inline-flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => saveEdit(r.id)}>
                              <Save className="h-4 w-4" /> Uložit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingId(null);
                                setDraft({});
                              }}
                              aria-label="Zrušit úpravy"
                            >
                              <X className="h-4 w-4" aria-hidden />
                            </Button>
                          </div>
                        ) : (
                          <div className="inline-flex flex-wrap justify-end gap-1">
                            {r.approved ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onApprove(r.id, false)}
                                title="Skrýt z veřejné stránky"
                              >
                                <EyeOff className="h-4 w-4" /> Skrýt
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onApprove(r.id, true)}
                                title="Zveřejnit"
                              >
                                <Check className="h-4 w-4" /> Schválit
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(r)}
                              aria-label="Upravit recenzi"
                            >
                              <Pencil className="h-4 w-4" aria-hidden />
                            </Button>
                            <ConfirmDialog
                              title="Opravdu smazat tuto recenzi?"
                              description="Tuto akci nelze vrátit zpět. Recenze bude trvale odstraněna."
                              onConfirm={() => onDelete(r.id)}
                            >
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-700"
                                aria-label="Smazat recenzi"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden />
                              </Button>
                            </ConfirmDialog>
                          </div>
                        )}
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterPill({
  active,
  tone,
  onClick,
  children,
}: {
  active?: boolean;
  tone?: "accent";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center rounded-full border px-3 text-sm transition-colors",
        active
            ? tone === "accent"
            ? "border-accent bg-accent/10 text-accent"
            : "border-foreground bg-foreground text-background"
          : "border-border text-foreground hover:border-foreground/60",
      )}
    >
      {children}
    </button>
  );
}
