import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

// On-demand revalidation endpoint for Shopify webhooks.
// When a product/collection changes in Shopify, a webhook POSTs here; if the
// shared secret matches, we invalidate the "shopify" cache tag so every page
// using catalogue data refreshes within seconds (instead of the 60s time window).
//
// Secured with a shared secret in the query string (?secret=…) — the standard
// Next.js on-demand-revalidation pattern. Set REVALIDATE_SECRET in the env and use
// the same value in each Shopify webhook URL.

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = new URL(request.url).searchParams.get("secret");
  return Boolean(process.env.REVALIDATE_SECRET) && secret === process.env.REVALIDATE_SECRET;
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, message: "invalid secret" }, { status: 401 });
  }
  revalidateTag("shopify", "max");
  return NextResponse.json({ ok: true, revalidated: true });
}

// Lets you sanity-check the endpoint in a browser (with ?secret=…) and answers
// Shopify's occasional GET verification ping.
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, message: "invalid secret" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, hint: "Shopify webhooks POST here to refresh the catalogue" });
}
