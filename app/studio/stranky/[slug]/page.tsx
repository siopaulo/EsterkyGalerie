import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { PageEditor } from "@/components/admin/page-editor";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { Page, PageBlock, Photo, PricingItem } from "@/types/database";

type Params = Promise<{ slug: string }>;

export default async function StudioPageEdit({ params }: { params: Params }) {
  await requireAdmin();
  const { slug } = await params;
  const admin = createSupabaseAdmin();
  const { data: page } = await admin.from("pages").select("*").eq("slug", slug).maybeSingle();
  if (!page) notFound();
  const [{ data: blocks }, { data: photos }, { data: pricingItems }] = await Promise.all([
    admin
      .from("page_blocks")
      .select("*")
      .eq("page_id", (page as Page).id)
      .order("sort_order", { ascending: true }),
    admin
      .from("photos")
      .select("id, display_name, cloudinary_public_id, alt_text, visibility")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(400),
    slug === "cenik"
      ? admin.from("pricing_items").select("*").order("section", { ascending: true }).order("sort_order", { ascending: true })
      : Promise.resolve({ data: null } as { data: null }),
  ]);

  const publicHref = (page as Page).slug === "_home" ? "/" : `/${(page as Page).slug}`;
  const isHome = (page as Page).slug === "_home";

  return (
    <>
      <AdminPageHeader
        title={isHome ? "Hlavní stránka" : (page as Page).title}
        description={
          isHome
            ? "Moduly homepage. Poskládej si úvod, carousel, sekce i CTA přesně jak chceš."
            : "Editor statické stránky"
        }
        breadcrumbs={[
          { label: "Studio", href: "/studio" },
          { label: "Stránky", href: "/studio/stranky" },
          { label: isHome ? "Hlavní stránka" : (page as Page).title },
        ]}
        actions={
          <Button asChild variant="outline">
            <Link href={publicHref} target="_blank">Zobrazit na webu</Link>
          </Button>
        }
      />
      <section className="max-w-full px-4 py-8 md:px-10">
        <PageEditor
          page={page as Page}
          blocks={(blocks ?? []) as PageBlock[]}
          availablePhotos={((photos ?? []) as Pick<Photo, "id" | "display_name" | "cloudinary_public_id" | "alt_text" | "visibility">[])}
          pricingItems={((pricingItems ?? []) as PricingItem[])}
        />
      </section>
    </>
  );
}
