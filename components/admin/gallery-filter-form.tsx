"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";

interface GalleryFilterFormProps {
  q: string;
  visibility: string;
  totalCount: number;
}

/**
 * Filtry galerie ve studiu – změna viditelnosti ihned odešle formulář (GET),
 * aby stránkování a hledání zůstaly konzistentní bez „zapomenutého“ Filtrovat.
 */
export function GalleryFilterForm({ q, visibility, totalCount }: GalleryFilterFormProps) {
  return (
    <form
      className="mb-6 flex max-w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
      method="get"
      onChange={(e) => {
        const el = e.target;
        if (el instanceof HTMLSelectElement) el.form?.requestSubmit();
      }}
    >
      <Input name="q" defaultValue={q} placeholder="Hledat…" className="w-full min-w-0 max-w-full sm:max-w-xs" />
      <select
        name="v"
        defaultValue={visibility}
        className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        aria-label="Viditelnost fotek"
      >
        <option value="all">Všechny</option>
        <option value="public">Veřejné</option>
        <option value="hidden">Skryté</option>
      </select>
      <button type="submit" className="h-10 rounded-md border border-border px-4 text-sm hover:bg-muted">
        Filtrovat
      </button>
      {q || visibility !== "all" ? (
        <Link href="/studio/galerie" className="text-sm text-muted-foreground underline underline-offset-4">
          Vymazat
        </Link>
      ) : null}
      <p className="text-sm text-muted-foreground sm:ml-auto">{totalCount} položek</p>
    </form>
  );
}
