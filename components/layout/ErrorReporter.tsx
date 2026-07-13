"use client";

import { useEffect } from "react";

// Catches errors the React boundaries can't — uncaught exceptions and unhandled
// promise rejections anywhere on the page — and ships them to /api/log-error so
// they reach our server logs. Also wires window.__pyjReportError, which
// lib/report-error (used by the error boundaries) forwards to. One mount in the
// root layout covers the whole app. When a Sentry DSN is added, this is where it
// initialises.
export default function ErrorReporter() {
  useEffect(() => {
    function send(payload: {
      message: string;
      stack?: string;
      context?: unknown;
    }) {
      try {
        const body = JSON.stringify({ ...payload, url: window.location.href });
        // keepalive so it still sends if the page is navigating/unloading.
        fetch("/api/log-error", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      } catch {
        /* never throw from the reporter */
      }
    }

    // Let lib/report-error (called by the error boundaries) forward here.
    (window as unknown as { __pyjReportError?: unknown }).__pyjReportError = (
      error: unknown,
      context?: Record<string, unknown>,
    ) => {
      const e = error as Error;
      send({ message: e?.message ?? String(error), stack: e?.stack, context });
    };

    const onError = (event: ErrorEvent) =>
      send({ message: event.message, stack: event.error?.stack });
    const onRejection = (event: PromiseRejectionEvent) =>
      send({
        message: "Unhandled rejection: " + String(event.reason),
        stack: (event.reason as Error)?.stack,
      });

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
