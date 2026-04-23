import { NextResponse, type NextRequest } from "next/server";
import { reviewInputSchema } from "@/features/reviews/schema";
import { verifyTurnstile } from "@/lib/turnstile";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getClientIp, hashIp, rateLimit } from "@/lib/rate-limit";
import { log } from "@/lib/logger";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

/**
 * Veřejné odeslání recenze. Recenze se uloží vždy s `approved = false`
 * a publikuje se až poté, co ji admin schválí ve /studio/recenze.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`reviews:${ip}`, 3, 60 * 60 * 1000);
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

  const parsed = reviewInputSchema.safeParse(body);
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
    log("warn", "reviews honeypot triggered", { ip });
    return NextResponse.json({ ok: true });
  }

  const turnstile = await verifyTurnstile(parsed.data.turnstileToken, ip);
  if (!turnstile.success) {
    log("warn", "reviews turnstile failed", { ip, reason: turnstile.reason });
    return NextResponse.json(
      { error: "Ověření proti robotům selhalo. Zkuste to prosím znovu." },
      { status: 400 },
    );
  }

  const ipHash = await hashIp(ip);
  const userAgent = request.headers.get("user-agent") ?? null;

  try {
    const admin = createSupabaseAdmin();
    const { error } = await admin.from("reviews").insert({
      name: parsed.data.name ?? null,
      message: parsed.data.message ?? null,
      rating: parsed.data.rating,
      approved: false,
      ip_hash: ipHash,
      user_agent: userAgent,
    });
    if (error) {
      log("error", "reviews db insert failed", { err: error.message });
      return NextResponse.json(
        { error: "Recenzi se nepodařilo uložit. Zkuste to prosím později." },
        { status: 500 },
      );
    }
  } catch (err) {
    log("error", "reviews db insert exception", { err: String(err) });
    return NextResponse.json(
      { error: "Recenzi se nepodařilo uložit. Zkuste to prosím později." },
      { status: 500 },
    );
  }

  // Admin dashboard zobrazuje počty → rovnou invalidujeme.
  revalidatePath("/studio");
  revalidatePath("/studio/recenze");

  return NextResponse.json({ ok: true });
}
