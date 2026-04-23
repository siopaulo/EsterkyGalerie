/**
 * Jednoduchý in-memory rate limiter (per-instance).
 * Pro produkci s více instancemi doplň Redis/Upstash.
 * Hash IP + cesta → bucket s token window.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = { success: boolean; remaining: number; resetAt: number };

export function rateLimit(key: string, limit = 5, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (bucket.count >= limit) {
    return { success: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { success: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

export async function hashIp(ip: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) return ip;
  const salt = process.env.IP_HASH_SALT ?? "esterky";
  const data = new TextEncoder().encode(`${salt}:${ip}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

/**
 * Vrátí nejdůvěryhodnější IP klienta z hlaviček.
 * Pořadí priority: `x-forwarded-for` → `cf-connecting-ip` → `x-real-ip`.
 * Při proxy řetězu bere první hodnotu z XFF (originální klient).
 * Fallback `0.0.0.0` zajistí, že rate-limit klíč je vždy validní string.
 */
export function getClientIp(req: { headers: Headers }): string {
  const header =
    req.headers.get("x-forwarded-for") ??
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    "";
  return header.split(",")[0]?.trim() || "0.0.0.0";
}
