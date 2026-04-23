import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { MessagesTable } from "@/components/admin/messages-table";
import type { ContactMessage } from "@/types/database";
import Link from "next/link";

export default async function StudioContactsPage() {
  await requireAdmin();
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <>
      <AdminPageHeader
        title="Zprávy z kontaktu"
        description="Zprávy odeslané z veřejného formuláře. Export do CSV je dostupný."
        actions={
          <Button asChild variant="outline">
            <Link href="/api/contacts/export" prefetch={false}>
              Exportovat CSV
            </Link>
          </Button>
        }
      />
      <section className="px-6 py-8 md:px-10">
        <MessagesTable messages={(data ?? []) as ContactMessage[]} />
      </section>
    </>
  );
}
