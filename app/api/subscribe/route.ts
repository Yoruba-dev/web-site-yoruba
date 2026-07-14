import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Newsletter subscribe → adds the email to Shopify's marketing list (email
// marketing consent = SUBSCRIBED). Runs SERVER-SIDE only, using the Admin API
// with a SECRET token — never exposed to the browser.
//
// Why: Shopify's "Recover abandoned cart" automation only emails MARKETING
// SUBSCRIBERS. Capturing the email isn't enough; the shopper must be subscribed.
//
// Setup (owner, one-time): create a custom app in Shopify Admin with the
// `write_customers` scope, install it, and put its Admin API access token in
// Netlify env as SHOPIFY_ADMIN_API_TOKEN. Until then this route succeeds softly
// (no-op) so the newsletter UI never breaks.
// ---------------------------------------------------------------------------

const DOMAIN =
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ?? process.env.SHOPIFY_STORE_DOMAIN;
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const API_VERSION = "2024-10";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

async function adminFetch<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(
    `https://${DOMAIN}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": ADMIN_TOKEN as string,
      },
      body: JSON.stringify({ query, variables }),
    },
  );
  return (await res.json()) as T;
}

const CONSENT = {
  marketingState: "SUBSCRIBED",
  marketingOptInLevel: "SINGLE_OPT_IN",
};

interface UserErr {
  message?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { email?: unknown };
    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    // Not configured yet → succeed softly so the popup/footer never break.
    if (!DOMAIN || !ADMIN_TOKEN) {
      return NextResponse.json({ ok: true, subscribed: false, reason: "not_configured" });
    }

    // 1) Try to create the customer already subscribed.
    const created = await adminFetch<{
      data?: {
        customerCreate?: { customer?: { id: string } | null; userErrors?: UserErr[] };
      };
    }>(
      /* GraphQL */ `
        mutation Subscribe($input: CustomerInput!) {
          customerCreate(input: $input) {
            customer { id }
            userErrors { field message }
          }
        }
      `,
      {
        input: {
          email,
          emailMarketingConsent: CONSENT,
          tags: ["newsletter", "web-popup"],
        },
      },
    );

    if (created?.data?.customerCreate?.customer?.id) {
      return NextResponse.json({ ok: true, subscribed: true, created: true });
    }

    // 2) Already exists → find by email and update consent.
    const errs = created?.data?.customerCreate?.userErrors ?? [];
    const taken = errs.some((e) => /taken|already|exists/i.test(e.message ?? ""));
    if (taken) {
      const found = await adminFetch<{
        data?: { customers?: { edges?: { node: { id: string } }[] } };
      }>(
        /* GraphQL */ `
          query FindCustomer($q: String!) {
            customers(first: 1, query: $q) { edges { node { id } } }
          }
        `,
        { q: `email:${email}` },
      );
      const id = found?.data?.customers?.edges?.[0]?.node?.id;
      if (id) {
        await adminFetch(
          /* GraphQL */ `
            mutation Consent($input: CustomerEmailMarketingConsentUpdateInput!) {
              customerEmailMarketingConsentUpdate(input: $input) {
                userErrors { field message }
              }
            }
          `,
          { input: { customerId: id, emailMarketingConsent: CONSENT } },
        );
        return NextResponse.json({ ok: true, subscribed: true, updated: true });
      }
    }

    return NextResponse.json({ ok: true, subscribed: false, errors: errs });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
