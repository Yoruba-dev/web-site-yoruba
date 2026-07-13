import * as Sentry from "@sentry/nextjs";

// Browser-side Sentry. Only initialises when a DSN is configured, so with no env
// var set the SDK does nothing (safe no-op in local/dev without a key).
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Keep it light for a storefront: sample a fraction of traces, no replay.
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === "production",
  });
}

// Lets Sentry tie errors to client-side navigations.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
