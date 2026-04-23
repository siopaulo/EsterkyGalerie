"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function toggleMessageHandledAction(id: string, handled: boolean) {
  await requireAdmin();
  const admin = createSupabaseAdmin();
  await admin.from("contact_messages").update({ handled }).eq("id", id);
  revalidatePath("/studio/kontakty");
  revalidatePath("/studio");
  return { ok: true };
}

export async function deleteMessageAction(id: string) {
  await requireAdmin();
  const admin = createSupabaseAdmin();
  await admin.from("contact_messages").delete().eq("id", id);
  revalidatePath("/studio/kontakty");
  return { ok: true };
}

export async function exportMessagesCsvAction(): Promise<string> {
  await requireAdmin();
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });
  const rows = data ?? [];
  const header = ["created_at", "name", "email", "phone", "subject", "message", "consent", "handled"];
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows
    .map((r) => header.map((k) => esc(r[k as keyof typeof r])).join(","))
    .join("\n");
  return `${header.join(",")}\n${body}`;
}
