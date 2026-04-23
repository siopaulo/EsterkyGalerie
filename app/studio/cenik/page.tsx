import { AdminPageHeader } from "@/components/admin/page-header";
import { PricingManager } from "@/components/admin/pricing-manager";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { PricingItem } from "@/types/database";

export default async function StudioPricingPage() {
  await requireAdmin();
  const admin = createSupabaseAdmin();
  const { data } = await admin.from("pricing_items").select("*").order("section").order("sort_order");
  return (
    <>
      <AdminPageHeader
        title="Ceník"
        description="Balíčky a doplňky. Každá položka má název, cenu, popis a seznam výhod."
      />
      <section className="px-6 py-8 md:px-10">
        <PricingManager initial={(data ?? []) as PricingItem[]} />
      </section>
    </>
  );
}
