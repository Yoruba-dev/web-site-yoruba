import { NextResponse } from "next/server";

// Submit a customer review to Judge.me. Runs server-side so it isn't blocked by
// the site's CSP (which doesn't allow the browser to reach judge.me) and so the
// shop domain never has to be trusted from the client. Judge.me's public
// create-review endpoint needs no token — the review lands in the store's
// MODERATION queue (pending) and only shows publicly once the owner approves it.
//
// POST /api/review  { productId, handle, email, name, rating, title?, body? }
const SHOP = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://pedrojewelryyoruba.com";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(request: Request) {
  if (!SHOP) {
    return NextResponse.json(
      { ok: false, error: "not_configured" },
      { status: 503 },
    );
  }

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const email = String(data.email ?? "").trim();
  const name = String(data.name ?? "").trim();
  const rating = Number(data.rating);
  const body = String(data.body ?? "").trim();
  const title = String(data.title ?? "").trim();
  const handle = String(data.handle ?? "").trim();
  // Judge.me identifies the product by its numeric Shopify id (external_id).
  const externalId = String(data.productId ?? "").match(/(\d+)/)?.[1];

  if (!EMAIL_RE.test(email) || !name || !(rating >= 1 && rating <= 5)) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {
    shop_domain: SHOP,
    platform: "shopify",
    email,
    name,
    rating,
    body,
  };
  if (title) payload.title = title;
  if (externalId) payload.id = externalId;
  if (handle) payload.url = `${SITE_URL}/products/${handle}`;

  try {
    const res = await fetch("https://judge.me/api/v1/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return NextResponse.json({ ok: true });
    const detail = (await res.text()).slice(0, 200);
    return NextResponse.json(
      { ok: false, error: "judgeme", detail },
      { status: 502 },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "network" }, { status: 502 });
  }
}
