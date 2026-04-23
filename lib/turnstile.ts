import "server-only";
import { serverEnv } from "@/lib/env";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(token: string | null | undefined, ip?: string | null) {
  const secret = serverEnv.turnstile.secret;
  if (!secret) {
    // Turnstile je volitelný – když není nakonfigurovaný (ani v produkci),
    // propustíme. Ochranu pak drží rate-limit + honeypot v /api/contact.
    // Jakmile nastavíš TURNSTILE_SECRET_KEY (a NEXT_PUBLIC_TURNSTILE_SITE_KEY),
    // ověření se automaticky zapne.
    if (process.env.NODE_ENV === "production") {
      console.warn("[turnstile] TURNSTILE_SECRET_KEY není nastaven – ověření vypnuto.");
      return { success: true as const, reason: "disabled" as const };
    }
    return { success: true as const, reason: "dev-bypass" as const };
  }

  if (!token) {
    return { success: false, reason: "missing-token" as const };
  }

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      cache: "no-store",
    });
    const json = (await res.json()) as { success: boolean; "error-codes"?: string[] };
    if (!json.success) {
      return { success: false, reason: (json["error-codes"] ?? []).join(",") || "failed" };
    }
    return { success: true as const };
  } catch (err) {
    console.error("[turnstile] verify error", err);
    return { success: false, reason: "network-error" as const };
  }
}
