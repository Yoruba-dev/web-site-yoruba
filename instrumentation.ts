import * as Sentry from "@sentry/nextjs";

// Server/edge Sentry init + the App Router error hook. Gated on the DSN so it's
// a no-op until the key is set (in .env.local locally, in Netlify for prod).
export async function register() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      enabled: process.env.NODE_ENV === "production",
    });
  }
}

// Captures errors thrown inside server components / route handlers.
export const onRequestError = Sentry.captureRequestError;
