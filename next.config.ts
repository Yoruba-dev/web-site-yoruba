import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// ---------------------------------------------------------------------------
// Content-Security-Policy for this headless storefront.
//
// Shipped in REPORT-ONLY mode: the browser reports violations to the console
// but does NOT block anything, so it can never break the live site. Once you've
// confirmed the store, 3D/AR viewer and Analytics work with no violations in
// DevTools → Console, switch the header key below from
// "Content-Security-Policy-Report-Only" to "Content-Security-Policy" to enforce.
//
// Every external origin the app actually uses is allow-listed:
//   - cdn.jsdelivr.net           → <model-viewer> 3D/AR library
//   - *.myshopify.com / cdn.shopify.com → product images, GLB models, cart API
//   - googletagmanager / google-analytics → GA4
// ---------------------------------------------------------------------------
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://www.googletagmanager.com https://*.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdn.shopify.com https://*.myshopify.com https://*.google-analytics.com https://*.googletagmanager.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.myshopify.com https://cdn.shopify.com https://cdn.jsdelivr.net https://*.google-analytics.com https://*.googletagmanager.com https://*.analytics.google.com https://*.sentry.io https://*.ingest.us.sentry.io",
  "media-src 'self' data: blob: https://cdn.shopify.com https://*.myshopify.com",
  "worker-src 'self' blob:",
  "frame-src 'self' https://*.myshopify.com",
  "form-action 'self' https://*.myshopify.com",
].join("; ");

// Security headers applied to every response. These are safe to enforce
// immediately — they don't affect the storefront, cart, checkout or 3D/AR.
const securityHeaders = [
  // Anti-clickjacking: don't let other sites embed us in an iframe.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Don't let the browser MIME-sniff responses into a different type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Only send the origin (not the full URL) on cross-site navigations.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable powerful features we don't use; keep the ones <model-viewer> AR needs.
  {
    key: "Permissions-Policy",
    value:
      "microphone=(), geolocation=(), browsing-topics=(), camera=(self), xr-spatial-tracking=(self), fullscreen=(self), accelerometer=(self), gyroscope=(self), magnetometer=(self)",
  },
  // Report-only for now (see note above) — flip the key to enforce later.
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  // Pin the workspace root to this project (avoids the multi-lockfile warning).
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  // When you later switch product images to next/image with Shopify's CDN,
  // allow its domain here:
  // images: { remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com" }] },
};

// Wrap with Sentry. This runs at build time (webpack) and is what wires the
// client/server SDK correctly. Source-map upload is disabled (no auth token
// needed); error capture still works. Preserves the config above (headers/CSP).
export default withSentryConfig(nextConfig, {
  silent: true,
  sourcemaps: { disable: true },
  telemetry: false,
});
