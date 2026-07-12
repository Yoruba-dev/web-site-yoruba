import crypto from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

// On-demand revalidation endpoint for Shopify webhooks.
// When a product/collection changes in Shopify, a webhook POSTs here; if the
// request is authentic, we invalidate the "shopify" cache tag so every page
// using catalogue data refreshes within seconds (instead of the 60s time window).
//
// Two ways to authenticate, checked in this order:
//   1. Shopify HMAC signature (preferred, tamper-proof):
//      set SHOPIFY_WEBHOOK_SECRET to your store's webhook signing secret
//      (Shopify admin → Settings → Notifications → Webhooks). Shopify signs the
//      raw body and sends it in the `X-Shopify-Hmac-SHA256` header.
//   2. Shared secret in the query string (?secret=…), legacy/manual fallback:
//      set REVALIDATE_SECRET and use the same value in the webhook URL.
// If neither is configured/valid, the request is rejected with 401.

export const dynamic = "force-dynamic";

/** Constant-time string comparison (avoids leaking length/content via timing). */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** Verify Shopify's HMAC-SHA256 signature over the raw request body. */
function hmacValid(rawBody: string, header: string | null): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");
  return safeEqual(digest, header);
}

/** Verify the ?secret=… query param against REVALIDATE_SECRET (constant-time). */
function querySecretValid(request: Request): boolean {
  const provided = new URL(request.url).searchParams.get("secret");
  const expected = process.env.REVALIDATE_SECRET;
  return Boolean(expected && provided && safeEqual(provided, expected));
}

function refresh() {
  revalidateTag("shopify", "max");
  return NextResponse.json({ ok: true, revalidated: true });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
  const authorized = hmacValid(rawBody, hmacHeader) || querySecretValid(request);
  if (!authorized) {
    return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });
  }
  return refresh();
}

// Lets you sanity-check the endpoint in a browser (with ?secret=…) and answers
// Shopify's occasional GET verification ping. GET carries no body, so only the
// shared-secret path applies here.
export async function GET(request: Request) {
  if (!querySecretValid(request)) {
    return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    hint: "Shopify webhooks POST here to refresh the catalogue",
  });
}
