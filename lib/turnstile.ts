import "server-only";
import { serverEnv } from "@/lib/env";
import { log } from "@/lib/logger";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(token: string | null | undefined, ip?: string | null) {
  const secret = serverEnv.turnstile.secret;
  if (!secret) {
    // Produkce BEZ TURNSTILE_SECRET_KEY je chyba konfigurace – nechceme
    // tichý bypass. Dev mód propustíme, abys mohl vyvíjet lokálně.
    // Pro lokální testování s oficiálními „always-pass" test keys od Cloudflare
    // stačí nastavit reálné klíče (i v devu) – ověření proběhne normálně.
    if (process.env.NODE_ENV === "production") {
      log("warn", "turnstile: TURNSTILE_SECRET_KEY missing in production");
      return { success: false, reason: "not-configured" as const };
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
    log("error", "turnstile: verify network error", { err: String(err) });
    return { success: false, reason: "network-error" as const };
  }
}
