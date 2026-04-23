"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="cs">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 40, textAlign: "center" }}>
        <h1 style={{ fontSize: 32 }}>Omlouvám se, web teď nemůže pokračovat.</h1>
        <p style={{ marginTop: 12, opacity: 0.7 }}>
          Zkuste obnovit stránku. Pokud chyba přetrvává, napište mi prosím e-mail.
        </p>
        <button
          onClick={() => reset()}
          style={{ marginTop: 20, padding: "10px 20px", cursor: "pointer" }}
        >
          Zkusit znovu
        </button>
        {error.digest ? (
          <p style={{ marginTop: 16, fontSize: 12, opacity: 0.5 }}>ID: {error.digest}</p>
        ) : null}
      </body>
    </html>
  );
}
