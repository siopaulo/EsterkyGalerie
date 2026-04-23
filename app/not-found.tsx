import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="font-serif text-8xl text-accent">404</p>
      <h1 className="mt-4 font-serif text-3xl md:text-4xl">Tahle stránka se nám ztratila</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Možná jste ji zahlédli, ale my ne. Zkuste se vrátit zpět na úvod nebo do galerie.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg" variant="primary">
          <Link href="/">Domů</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/galerie">Galerie</Link>
        </Button>
      </div>
    </div>
  );
}
