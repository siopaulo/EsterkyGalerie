"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { log } from "@/lib/logger";
import { sendReplyEmail } from "@/lib/resend";
import { replyInputSchema, type ReplyInput } from "./schema";

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
  revalidatePath("/studio");
  return { ok: true };
}

export type ReplyActionResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Odešle odpověď na kontaktní zprávu přes Resend. Kontaktní zprávu pak
 * označí jako vyřízenou, aby admin neztrácel přehled.
 */
export async function replyToMessageAction(input: ReplyInput): Promise<ReplyActionResult> {
  await requireAdmin();
  const parsed = replyInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Neplatná data";
    return { ok: false, error: first };
  }

  const admin = createSupabaseAdmin();
  const { data: msg, error } = await admin
    .from("contact_messages")
    .select("id, name, email")
    .eq("id", parsed.data.messageId)
    .maybeSingle();

  if (error || !msg) {
    return { ok: false, error: "Zpráva nebyla nalezena." };
  }

  const result = await sendReplyEmail({
    to: msg.email,
    subject: parsed.data.subject,
    message: parsed.data.body,
    recipientName: msg.name,
  });

  if (!result.sent) {
    if (result.reason === "not-configured") {
      return {
        ok: false,
        error: "Odesílání e-mailů není nakonfigurováno. Doplň RESEND_API_KEY, RESEND_FROM a CONTACT_DELIVERY_EMAIL.",
      };
    }
    // Resend chyby logujeme detailně v `lib/resend.ts`, tady nechceme posílat surové hlášky do UI.
    return {
      ok: false,
      error:
        result.error && /domain is not verified/i.test(result.error)
          ? "Odpověď se nepodařilo odeslat – odesílací doména není ověřená pro aktuální Resend API klíč. Zkontroluj `RESEND_API_KEY` a `RESEND_FROM` v deployi."
          : "Odpověď se nepodařilo odeslat. Zkuste to prosím znovu za chvíli.",
    };
  }

  const { error: logErr } = await admin.from("contact_message_replies").insert({
    contact_message_id: msg.id,
    to_email: msg.email,
    subject: parsed.data.subject.trim(),
    body: parsed.data.body.trim(),
  });
  if (logErr) {
    // E-mail už odešel – chybu logujeme, adminovi ale oznámíme úspěch odeslání.
    log("error", "contact_message_replies insert failed", { err: logErr.message });
  }

  await admin.from("contact_messages").update({ handled: true }).eq("id", msg.id);
  revalidatePath("/studio/kontakty");
  revalidatePath("/studio");
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
