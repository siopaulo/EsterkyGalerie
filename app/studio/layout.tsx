import type { Metadata } from "next";
import { StudioChrome } from "@/components/admin/studio-chrome";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    return <div className="min-h-screen">{children}</div>;
  }

  return <StudioChrome userEmail={user.email ?? null}>{children}</StudioChrome>;
}
