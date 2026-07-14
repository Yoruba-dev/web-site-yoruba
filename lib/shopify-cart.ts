"use client";

import type { CartLine } from "./cart-context";

// ---------------------------------------------------------------------------
// Client-side Shopify cart + checkout.
//
// Uses the PUBLIC Storefront API token — safe to expose in the browser: it only
// grants storefront/cart access, never admin. (Shopify's own Hydrogen exposes it
// client-side too.) Activates when these are set in .env.local:
//   NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
//   NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
// Until then, isShopifyCartEnabled() is false and the site uses the demo checkout.
// ---------------------------------------------------------------------------

const API_VERSION = "2024-10";
const DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

export function isShopifyCartEnabled(): boolean {
  return Boolean(DOMAIN && TOKEN);
}

interface CartCreateResponse {
  cartCreate: {
    cart: { id: string; checkoutUrl: string } | null;
    userErrors: { field: string[] | null; message: string }[];
  };
}

/** Map a customized line's engraving into Shopify line-item attributes, so the
 *  order in the Shopify admin shows exactly what (and how) to engrave. */
function lineAttributes(l: CartLine): { key: string; value: string }[] {
  const c = l.customization;
  if (!c) return [];
  const attrs: { key: string; value: string }[] = [];
  if (c.text) attrs.push({ key: "Grabado", value: c.text });
  if (c.font) attrs.push({ key: "Tipografía", value: c.font });
  if (c.metal) attrs.push({ key: "Metal", value: c.metal });
  if (c.shape) attrs.push({ key: "Forma", value: c.shape });
  return attrs;
}

/** All Shopify line-item attributes for a line: engraving + any custom
 *  properties (e.g. the made-to-order "Color / Orisha" choice). */
function allLineAttributes(l: CartLine): { key: string; value: string }[] {
  return [...lineAttributes(l), ...(l.properties ?? [])];
}

/** An order-level note summarising the custom choices across all lines, so the
 *  workshop sees them at a glance in the Shopify order. */
function orderNote(lines: CartLine[]): string {
  const bits = lines.flatMap((l) =>
    (l.properties ?? []).map((p) => `${l.title} → ${p.key}: ${p.value}`),
  );
  return bits.join(" | ");
}

/** Creates a Shopify cart from the local lines and returns the hosted checkout
 *  URL — Shopify collects shipping + payment there. Throws on failure. */
export async function createShopifyCheckout(lines: CartLine[]): Promise<string> {
  if (!DOMAIN || !TOKEN) throw new Error("Shopify is not configured.");

  const cartLines = lines.map((l) => ({
    // Real Shopify ProductVariant GID. Custom (engraved) pieces carry the product's
    // real variant in `merchandiseId` and a synthetic `id` for local uniqueness.
    merchandiseId: l.merchandiseId ?? l.id,
    quantity: l.quantity,
    attributes: allLineAttributes(l),
  }));
  const note = orderNote(lines);

  const query = /* GraphQL */ `
    mutation CartCreate($lines: [CartLineInput!]!, $note: String) {
      cartCreate(input: { lines: $lines, note: $note }) {
        cart { id checkoutUrl }
        userErrors { field message }
      }
    }
  `;

  const res = await fetch(`https://${DOMAIN}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
    },
    body: JSON.stringify({
      query,
      variables: { lines: cartLines, note: note || null },
    }),
  });

  if (!res.ok) throw new Error(`Shopify checkout failed: ${res.status}`);
  const json = (await res.json()) as { data?: CartCreateResponse; errors?: unknown };
  if (json.errors) throw new Error(`Shopify error: ${JSON.stringify(json.errors)}`);

  const result = json.data?.cartCreate;
  if (!result?.cart?.checkoutUrl) {
    throw new Error(result?.userErrors?.[0]?.message ?? "No checkout URL returned.");
  }
  return result.cart.checkoutUrl;
}

// ---------------------------------------------------------------------------
// Abandoned-cart recovery for a headless storefront. Our cart lives locally
// (localStorage) so Shopify can't see it — UNTIL we hand it a cart WITH the
// shopper's email (buyerIdentity). Once a cart carries an email and isn't
// completed, Shopify records it as an abandoned checkout and its recovery
// automation/email fires — even if the shopper never reached the checkout page.
//
// We call this after the shopper gives their email (newsletter) AND has items.
// It's signature-gated so the same (email + lines) is only registered once,
// which keeps us from creating duplicate abandoned checkouts.
// ---------------------------------------------------------------------------
const ABANDONED_SIG_KEY = "pyj_abandoned_sig";

function cartSignature(lines: CartLine[], email: string): string {
  const items = lines
    .map((l) => `${l.merchandiseId ?? l.id}x${l.quantity}`)
    .sort()
    .join(",");
  return `${email.toLowerCase()}|${items}`;
}

export async function registerAbandonedCart(
  lines: CartLine[],
  email: string,
): Promise<void> {
  if (!DOMAIN || !TOKEN || !email || lines.length === 0) return;

  const sig = cartSignature(lines, email);
  try {
    if (localStorage.getItem(ABANDONED_SIG_KEY) === sig) return; // already sent
  } catch {
    /* ignore */
  }

  const cartLines = lines.map((l) => ({
    merchandiseId: l.merchandiseId ?? l.id,
    quantity: l.quantity,
    attributes: allLineAttributes(l),
  }));
  const note = orderNote(lines);
  const query = /* GraphQL */ `
    mutation AbandonedCart($lines: [CartLineInput!]!, $email: String!, $note: String) {
      cartCreate(
        input: { lines: $lines, buyerIdentity: { email: $email }, note: $note }
      ) {
        cart { id }
        userErrors { message }
      }
    }
  `;

  try {
    const res = await fetch(
      `https://${DOMAIN}/api/${API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": TOKEN,
        },
        body: JSON.stringify({
          query,
          variables: { lines: cartLines, email, note: note || null },
        }),
        keepalive: true, // let it finish even if the tab is closing
      },
    );
    if (res.ok) {
      try {
        localStorage.setItem(ABANDONED_SIG_KEY, sig);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* best-effort — never block the UI on this */
  }
}
