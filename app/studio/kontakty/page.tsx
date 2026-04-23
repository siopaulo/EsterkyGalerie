import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { MessagesTable, messagesTableRefreshKey } from "@/components/admin/messages-table";
import { SentRepliesTable } from "@/components/admin/sent-replies-table";
import {
  mapSentRepliesFromSupabase,
  type SentReplyRow,
  type SentReplySupabaseRow,
} from "@/features/contact/sent-replies";
import type { ContactMessage } from "@/types/database";
import Link from "next/link";
import { cn } from "@/lib/utils";

type SP = Promise<Record<string, string | string[] | undefined>>;

function one(p: string | string[] | undefined): string | undefined {
  if (typeof p === "string") return p;
  if (Array.isArray(p)) return p[0];
  return undefined;
}

export default async function StudioContactsPage({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const tab = one(sp.tab) === "sent" ? "sent" : "received";
  const focus = one(sp.focus);

  const admin = createSupabaseAdmin();

  let messages: ContactMessage[] = [];
  let replies: SentReplyRow[] = [];

  if (tab === "received") {
    const { data } = await admin
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    messages = (data ?? []) as ContactMessage[];
  } else {
    const { data } = await admin
      .from("contact_message_replies")
      .select(
        "id, contact_message_id, to_email, subject, body, created_at, contact_messages(name, subject, message)",
      )
      .order("created_at", { ascending: false })
      .limit(300);
    replies = mapSentRepliesFromSupabase(data as SentReplySupabaseRow[] | null);
  }

  return (
    <>
      <AdminPageHeader
        title="Zprávy z kontaktu"
        description="Přijaté dotazy z webu a historie odpovědí odeslaných přes studio (vlákna přes Re:)."
        actions={
          <Button asChild variant="outline">
            <Link href="/api/contacts/export" prefetch={false}>
              Exportovat CSV
            </Link>
          </Button>
        }
      />
      <section className="px-6 py-8 md:px-10">
        <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4">
          <Link
            href="/studio/kontakty?tab=received"
            className={cn(
              "inline-flex h-10 items-center rounded-full border px-4 text-sm transition-colors",
              tab === "received"
                ? "border-foreground bg-foreground text-background"
                : "border-border text-foreground hover:border-foreground/60",
            )}
          >
            Přijaté zprávy
          </Link>
          <Link
            href="/studio/kontakty?tab=sent"
            className={cn(
              "inline-flex h-10 items-center rounded-full border px-4 text-sm transition-colors",
              tab === "sent"
                ? "border-foreground bg-foreground text-background"
                : "border-border text-foreground hover:border-foreground/60",
            )}
          >
            Odeslané odpovědi
          </Link>
        </div>

        {tab === "received" ? (
          <MessagesTable
            key={messagesTableRefreshKey(messages)}
            messages={messages}
            focusMessageId={focus}
          />
        ) : (
          <SentRepliesTable rows={replies} />
        )}
      </section>
    </>
  );
}
