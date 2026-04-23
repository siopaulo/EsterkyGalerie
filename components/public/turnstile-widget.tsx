"use client";

import Script from "next/script";
import { useEffect, useId, useRef } from "react";
import { publicEnv } from "@/lib/env";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement | string, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
    __esterkyTurnstileReady?: boolean;
    __esterkyTurnstileQueue?: Array<() => void>;
  }
}

interface TurnstileWidgetProps {
  /** Callback s aktuálním tokenem. Při vypršení / chybě dostane "". */
  onToken: (token: string) => void;
  /** Skin widgetu. `light` je výchozí, protože web je světlý. */
  theme?: "light" | "dark" | "auto";
  /** Identifikátor pro debugging / test. Nepodporuje reset mezi formy. */
  action?: string;
  className?: string;
}

/**
 * Sdílený Turnstile widget.
 *
 * - Pokud není nastaven NEXT_PUBLIC_TURNSTILE_SITE_KEY, nic se nerenderuje
 *   a `onToken` zůstane nezavolán. V produkci pak serverové ověření selže
 *   jako "not-configured" – to je úmyslně hlasité selhání, aby se nestalo,
 *   že běží produkce bez ochrany.
 * - Explicit render: skript načteme s `render=explicit` a widget vložíme
 *   sami, díky čemuž přežije navigace i přemountování komponenty.
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

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!siteKey) return;
    if (typeof window === "undefined") return;

    const render = () => {
      if (!window.turnstile || !containerRef.current) return;
      if (widgetIdRef.current !== null) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        action,
        callback: (token: string) => onTokenRef.current(token),
        "expired-callback": () => onTokenRef.current(""),
        "error-callback": () => onTokenRef.current(""),
        "timeout-callback": () => onTokenRef.current(""),
      });
    };

    if (window.__esterkyTurnstileReady) {
      render();
    } else {
      window.__esterkyTurnstileQueue ??= [];
      window.__esterkyTurnstileQueue.push(render);
    }

    return () => {
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
    <>
      <Script
        id="turnstile-api"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__esterkyTurnstileOnLoad&render=explicit"
        strategy="afterInteractive"
      />
      <Script id="turnstile-onload" strategy="beforeInteractive">{`
        window.__esterkyTurnstileOnLoad = function(){
          window.__esterkyTurnstileReady = true;
          var q = window.__esterkyTurnstileQueue || [];
          window.__esterkyTurnstileQueue = [];
          for (var i = 0; i < q.length; i++) { try { q[i](); } catch(e) {} }
        };
      `}</Script>
      <div ref={containerRef} id={`turnstile-${domId}`} className={className} />
    </>
  );
}
