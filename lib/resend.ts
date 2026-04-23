import "server-only";
import { Resend } from "resend";
import { serverEnv } from "@/lib/env";
import { log } from "@/lib/logger";

let client: Resend | null = null;

function getClient(apiKey: string) {
  if (!client) {
    client = new Resend(apiKey);
  }
  return client;
}

export interface ContactEmailPayload {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  deliveryTarget?: string | null;
}

export interface SendResult {
  sent: boolean;
  reason?: "not-configured" | "error";
  error?: string;
}

/**
 * Odešle e-mail přes Resend, pokud je nakonfigurován. Pokud ne, NEPROPADÁ –
 * jen zaloguje a vrátí { sent: false, reason: "not-configured" }. Volající
 * se tak může rozhodnout, zda UX nechat na „uloženo, e-mail nedoručen“ apod.
 */
export async function sendContactEmail(payload: ContactEmailPayload): Promise<SendResult> {
  const { apiKey, from, to, configured } = serverEnv.resend;
  if (!configured || !apiKey || !from) {
    log("warn", "resend not configured – e-mail nebyl odeslán", { name: payload.name });
    return { sent: false, reason: "not-configured" };
  }
  const target = payload.deliveryTarget || to;
  if (!target) {
    log("warn", "resend bez cílové adresy – e-mail nebyl odeslán");
    return { sent: false, reason: "not-configured" };
  }

  const subject = payload.subject?.trim()
    ? `[Web] ${payload.subject}`
    : `[Web] Nová zpráva od ${payload.name}`;

  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#2a2520;">
      <h2 style="border-bottom:1px solid #eee;padding-bottom:8px;">Nová zpráva z webu</h2>
      <p><strong>Jméno:</strong> ${escapeHtml(payload.name)}</p>
      <p><strong>E-mail:</strong> <a href="mailto:${escapeHtml(payload.email)}">${escapeHtml(payload.email)}</a></p>
      ${payload.phone ? `<p><strong>Telefon:</strong> ${escapeHtml(payload.phone)}</p>` : ""}
      ${payload.subject ? `<p><strong>Předmět:</strong> ${escapeHtml(payload.subject)}</p>` : ""}
      <p><strong>Zpráva:</strong></p>
      <p style="white-space:pre-wrap;background:#faf7f2;padding:12px;border-radius:6px;">${escapeHtml(payload.message)}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
      <p style="font-size:12px;color:#888;">Odesláno z kontaktního formuláře webu.</p>
    </div>
  `;

  const text = [
    `Nová zpráva z webu`,
    `Jméno: ${payload.name}`,
    `E-mail: ${payload.email}`,
    payload.phone ? `Telefon: ${payload.phone}` : null,
    payload.subject ? `Předmět: ${payload.subject}` : null,
    ``,
    payload.message,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = await getClient(apiKey).emails.send({
      from,
      to: [target],
      replyTo: payload.email,
      subject,
      html,
      text,
    });
    if (result.error) {
      log("error", "resend error", { err: result.error.message });
      return { sent: false, reason: "error", error: result.error.message };
    }
    return { sent: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("error", "resend exception", { err: msg });
    return { sent: false, reason: "error", error: msg };
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
