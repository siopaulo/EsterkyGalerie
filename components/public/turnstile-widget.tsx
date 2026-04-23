"use client";

import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";
import { publicEnv } from "@/lib/env";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement | string, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  /** Callback s aktuálním tokenem. Při vypršení / chybě dostane "". */
  onToken: (token: string) => void;
  /** Skin widgetu. `light` je výchozí, protože web je světlý. */
  theme?: "light" | "dark" | "auto";
  /** Identifikátor pro debugging / test. */
  action?: string;
  className?: string;
}

/**
 * Sdílený Turnstile widget.
 *
 * - Pokud není nastaven NEXT_PUBLIC_TURNSTILE_SITE_KEY, nic se nerenderuje
 *   a `onToken` zůstane nezavolán.
 * - Používá explicit render a sám si hlídá, kdy je API dostupné (polling).
 *   Tím pokrývá všechny scénáře:
 *     a) první návštěva – API se teprve načítá (poll čeká),
 *     b) navigace v rámci SPA – `window.turnstile` už existuje (render hned),
 *     c) pomalé spojení – poll čeká, dokud skript nepřijde (až 20 s).
 */
export function TurnstileWidget({
  onToken,
  theme = "light",
  action,
  className,
}: TurnstileWidgetProps) {
  const siteKey = publicEnv.turnstileSiteKey;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const domId = useId();
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "timeout">(
    "idle",
  );

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!siteKey) return;
    if (typeof window === "undefined") return;

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 200; // ~20 s při 100 ms intervalu

    const tryRender = () => {
      if (cancelled) return;
      const ts = window.turnstile;
      if (!ts || !containerRef.current) {
        attempts += 1;
        if (attempts === 1) setStatus("loading");
        if (attempts > MAX_ATTEMPTS) {
          setStatus("timeout");
          return;
        }
        window.setTimeout(tryRender, 100);
        return;
      }
      if (widgetIdRef.current !== null) {
        setStatus("ready");
        return;
      }
      try {
        widgetIdRef.current = ts.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          action,
          callback: (token: string) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(""),
          "error-callback": () => onTokenRef.current(""),
          "timeout-callback": () => onTokenRef.current(""),
        });
        setStatus("ready");
      } catch {
        // např. kontejner v mezičase zmizel – zkusíme znovu
        attempts += 1;
        if (attempts > MAX_ATTEMPTS) {
          setStatus("timeout");
          return;
        }
        window.setTimeout(tryRender, 100);
      }
    };

    tryRender();

    return () => {
      cancelled = true;
      const id = widgetIdRef.current;
      if (id !== null && window.turnstile) {
        try {
          window.turnstile.remove(id);
        } catch {
          // ignore – widget se mohl samovolně odmountovat
        }
      }
      widgetIdRef.current = null;
    };
  }, [siteKey, theme, action]);

  if (!siteKey) return null;

  return (
    <div className={className}>
      <Script
        id="cf-turnstile-api"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />
      <div ref={containerRef} id={`turnstile-${domId}`} />
      {status === "timeout" ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Ověření se nepodařilo načíst. Zkontrolujte připojení nebo stránku obnovte.
        </p>
      ) : null}
    </div>
  );
}
