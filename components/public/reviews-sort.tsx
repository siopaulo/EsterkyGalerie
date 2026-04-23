"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type Sort = "newest" | "oldest" | "best" | "worst";

const OPTIONS: Array<{ value: Sort; label: string }> = [
  { value: "newest", label: "Nejnovější" },
  { value: "oldest", label: "Nejstarší" },
  { value: "best", label: "Nejlepší hodnocení" },
  { value: "worst", label: "Nejhorší hodnocení" },
];

export function ReviewsSort({ value }: { value: Sort }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function onChange(next: Sort) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (next === "newest") params.delete("sort");
    else params.set("sort", next);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      Řazení
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Sort)}
        disabled={pending}
        className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground disabled:opacity-60"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
