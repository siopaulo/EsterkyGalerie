import { NextResponse, type NextRequest } from "next/server";
import { contactSchema } from "@/features/contact/schema";
import { verifyTurnstile } from "@/lib/turnstile";
import { sendContactEmail } from "@/lib/resend";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit, hashIp } from "@/lib/rate-limit";
import { log } from "@/lib/logger";
import { serverEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const rl = rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Příliš mnoho pokusů. Zkuste to prosím později." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neplatný požadavek." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Formulář obsahuje neplatné údaje.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  // honeypot
  if (parsed.data.website && parsed.data.website.length > 0) {
    log("warn", "contact honeypot triggered", { ip });
    return NextResponse.json({ ok: true });
  }

  const turnstile = await verifyTurnstile(parsed.data.turnstileToken, ip);
  if (!turnstile.success) {
    log("warn", "contact turnstile failed", { ip, reason: turnstile.reason });
    return NextResponse.json(
      { error: "Ověření proti robotům selhalo. Zkuste to prosím znovu." },
      { status: 400 },
    );
  }

  const ipHash = await hashIp(ip);
  const userAgent = request.headers.get("user-agent") ?? null;

  // 1) Uložit do DB – toto je zdroj pravdy. Pokud selže, skutečně se zpráva ztratila.
  let dbSaved = false;
  try {
    const admin = createSupabaseAdmin();
    const { error: dbError } = await admin.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      subject: parsed.data.subject ?? null,
      message: parsed.data.message,
      consent:
        parsed.data.consent === true ||
        parsed.data.consent === "true" ||
        parsed.data.consent === "on",
      ip_hash: ipHash,
      user_agent: userAgent,
    });
    if (dbError) {
      log("error", "contact db insert failed", { err: dbError.message });
    } else {
      dbSaved = true;
    }
  } catch (err) {
    log("error", "contact db insert exception", { err: String(err) });
  }

  if (!dbSaved) {
    return NextResponse.json(
      { error: "Zprávu se nepodařilo uložit. Zkuste to prosím později." },
      { status: 500 },
    );
  }

  // 2) Odeslat e-mail. Selhání není kritické – zpráva je v DB, admin ji uvidí v /studio.
  const emailResult = await sendContactEmail({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    subject: parsed.data.subject,
    message: parsed.data.message,
    deliveryTarget: serverEnv.resend.to,
  });

  if (!emailResult.sent) {
    log("warn", "contact email not delivered (zpráva uložena)", {
      reason: emailResult.reason,
      error: emailResult.error,
    });
  }

  return NextResponse.json({ ok: true, emailDelivered: emailResult.sent });
}

function clientIp(req: NextRequest): string {
  const header =
    req.headers.get("x-forwarded-for") ??
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    "";
  return header.split(",")[0]?.trim() || "0.0.0.0";
}
