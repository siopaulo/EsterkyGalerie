/**
 * Společné volby Sentry pro server / edge / klient.
 * Bez DSN se SDK neinicializuje (žádný overhead v dev bez .env).
 */
export function getSentryDsn(): string | undefined {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  return dsn && dsn.length > 0 ? dsn : undefined;
}

export function getSentryEnvironment(): string | undefined {
  return (
    process.env.SENTRY_ENVIRONMENT ||
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV ||
    undefined
  );
}

export function getTracesSampleRate(): number {
  const raw = process.env.SENTRY_TRACES_SAMPLE_RATE;
  if (raw == null || raw === "") return 0.1;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.1;
}
