import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/sidebar";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen bg-muted/30">
      {user ? <AdminSidebar userEmail={user.email ?? null} /> : null}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
