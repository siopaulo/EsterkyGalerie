"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-background px-6 text-center">
      <p className="font-serif text-6xl text-accent">Hm…</p>
      <h1 className="mt-3 font-serif text-3xl md:text-4xl">Něco se pokazilo</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Omlouvám se za nepříjemnost. Zkuste stránku načíst znovu.
        {error.digest ? <span className="block mt-2 text-xs opacity-70">ID: {error.digest}</span> : null}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={reset} variant="primary">
          Zkusit znovu
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Domů</Link>
        </Button>
      </div>
    </div>
  );
}
