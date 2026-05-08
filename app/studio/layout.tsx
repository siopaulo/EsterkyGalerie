import type { Metadata } from "next";
import { StudioChrome } from "@/components/admin/studio-chrome";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { StudioBadges } from "@/lib/admin-studio-nav";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

async function loadStudioBadges(): Promise<StudioBadges> {
  // Dvě levné count dotazy v paralelu – jen pro odznaky v menu.
  // Žádný realtime/polling, jen per-request.
  try {
    const admin = createSupabaseAdmin();
    const [{ count: messages }, { count: reviews }] = await Promise.all([
      admin
        .from("contact_messages")
        .select("id", { count: "exact", head: true })
        .eq("handled", false),
      admin
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("approved", false),
    ]);
    return {
      messages: messages ?? 0,
      reviews: reviews ?? 0,
    };
  } catch {
    // Bez badge se obejdeme, raději vrátit prázdné než shodit layout.
    return {};
  }
}

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    return <div className="min-h-screen">{children}</div>;
  }

  const badges = await loadStudioBadges();

  return (
    <StudioChrome userEmail={user.email ?? null} badges={badges}>
      {children}
    </StudioChrome>
  );
}
