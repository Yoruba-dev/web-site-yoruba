import * as Sentry from "@sentry/nextjs";

// Server-runtime Sentry. Gated on the DSN so it's a no-op until the key is set.
const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === "production",
  });
}
