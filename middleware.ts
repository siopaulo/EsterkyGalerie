import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Pouze /studio a /api/studio* potřebují session refresh + admin guard.
     * Ostatní cesty (homepage, /o-mne, /sluzby, /galerie, /pribehy/*, …)
     * jsou veřejné a nepoužívají cookies, takže middleware tam jen
     * zbytečně přidává Supabase round-trip a brání plnému static / ISR
     * rendrování. Toto omezení matcheru je důležité pro LCP a TTFB,
     * protože odstraní 100–500 ms latence z každé public stránky.
     *
     * Login route /studio/login zůstává pokrytý kvůli redirectu na /studio,
     * pokud už je uživatel přihlášený.
     */
    "/studio",
    "/studio/:path*",
  ],
};
