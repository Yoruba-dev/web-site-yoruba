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
    // ---------------------------------------------------------------------
    // Noise filter. These errors DON'T come from our code — they're injected
    // in the visitor's environment: in-app browsers (Instagram / Facebook /
    // TikTok WebViews), iOS native WKWebView bridges, browser extensions,
    // password managers and content blockers. They don't affect the store, so
    // we drop them instead of alerting on them.
    // ---------------------------------------------------------------------
    ignoreErrors: [
      // iOS WKWebView bridge assumed by injected scripts (the reported one).
      /window\.webkit\.messageHandlers/i,
      /webkit\.messageHandlers/i,
      // In-app browser search / autofill bridges.
      /instantSearchSDKJSBridge/i,
      /_AutofillCallbackHandler/i,
      // Benign layout-observer chatter (never a real bug).
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
    ],
    // Drop events whose stack originates in a browser extension / injected script.
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      /^moz-extension:\/\//i,
      /^safari-(web-)?extension:\/\//i,
      /webkit-masked-url/i,
    ],
  });
}

// Ties errors to client-side navigations.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
