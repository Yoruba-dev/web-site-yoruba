// Single seam for error reporting. Every error boundary calls this, so wiring a
// service (Sentry, etc.) later means changing ONE file, not every boundary.
//
// Today it logs to the console and, if a reporter has been attached on
// `window` (e.g. Sentry's global), forwards to it. When the Sentry DSN is
// configured we replace the body here with `Sentry.captureException`.

import * as Sentry from "@sentry/nextjs";

type Reporter = (error: unknown, context?: Record<string, unknown>) => void;

interface WindowWithReporter extends Window {
  __pyjReportError?: Reporter;
  Sentry?: { captureException?: (e: unknown) => void };
}

export function reportError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  // Always surface it in the console/server logs.
  // eslint-disable-next-line no-console
  console.error("[app-error]", error, context ?? "");

  // Send to Sentry — a no-op until a DSN is configured (see instrumentation*).
  try {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  } catch {
    /* never let reporting throw */
  }

  if (typeof window === "undefined") return;
  const w = window as WindowWithReporter;
  try {
    if (typeof w.__pyjReportError === "function") {
      w.__pyjReportError(error, context);
    } else if (w.Sentry?.captureException) {
      w.Sentry.captureException(error);
    }
  } catch {
    /* never let reporting throw */
  }
}
