// Merchant commerce policy for structured data — declared ONCE here and reused
// by every schema.org Offer (product pages today; feeds/other surfaces later).
//
// Owner decision (2026-07-15): ALL SALES FINAL — no devoluciones. The pieces
// are custom / religious jewelry; the lifetime warranty covers repairs, never
// returns. Google shows this on shopping results, so it must reflect reality.
//
// Shipping: NOT declared yet. Shopify has no shipping rates configured (the
// store coordinates each delivery per order — see FAQ). When real rates exist
// in Shopify (Configuración → Envío), add an OfferShippingDetails object here
// and spread it into the product Offer the same way as the return policy.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://pedrojewelryyoruba.com";

export const RETURN_POLICY_SCHEMA = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "US",
  returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
  // The human-readable policy (ventas finales + garantía + reparaciones).
  merchantReturnLink: `${SITE_URL}/garantia-y-devoluciones`,
} as const;
