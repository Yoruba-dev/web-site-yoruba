import * as Sentry from "@sentry/nextjs";

// Loads the right Sentry runtime config per runtime (the official pattern).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captures errors thrown inside server components / route handlers.
export const onRequestError = Sentry.captureRequestError;
