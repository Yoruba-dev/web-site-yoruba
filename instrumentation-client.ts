import * as Sentry from "@sentry/nextjs";

// Browser-runtime Sentry. No-op until a DSN is configured. This works because
// next.config is wrapped with withSentryConfig (the piece the earlier attempt
// was missing — without it the client SDK broke hydration).
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === "production",
  });
}

// Ties errors to client-side navigations.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
