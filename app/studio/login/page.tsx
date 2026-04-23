import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Přihlášení – Studio",
  robots: { index: false, follow: false },
};

type SP = Promise<{ next?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SP }) {
  const { next } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Studio
          </p>
          <h1 className="mt-2 font-serif text-3xl">Přihlášení</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Přístup pouze pro autorku webu.
          </p>
        </div>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
