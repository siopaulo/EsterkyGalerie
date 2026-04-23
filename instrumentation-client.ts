import * as Sentry from "@sentry/nextjs";
import { getSentryDsn, getSentryEnvironment, getTracesSampleRate } from "@/lib/sentry.config.shared";

Sentry.init({
  dsn: getSentryDsn(),
  environment: getSentryEnvironment(),
  tracesSampleRate: getTracesSampleRate(),
  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
