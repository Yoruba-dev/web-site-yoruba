import { SITE } from "./site";

// ---------------------------------------------------------------------------
// Commerce / purchase policy — the single source of truth for HOW a piece can
// be ordered. Every purchase surface (product page, product cards, shop
// listing, wishlist) reads from here, so the "buy online" vs "order by
// consultation (por encargo)" decision lives in ONE place and stays
// consistent. No component hardcodes this logic or the contact number.
// ---------------------------------------------------------------------------

/** How the storefront takes orders. */
export type PurchaseMode = "direct" | "made-to-order";

/**
 * Global purchase mode.
 *   - "made-to-order": no direct online checkout — every piece is ordered
 *     through a WhatsApp consultation so specs (size, karat, Orisha, measures)
 *     are confirmed by the workshop before any payment. Safest while the
 *     catalogue (stock, variants) is being finalised.
 *   - "direct": normal e-commerce — pieces are bought online, subject to stock
 *     and to any per-product override in `MADE_TO_ORDER_TAGS`.
 *
 * Flip to "direct" to re-enable online checkout store-wide.
 */
export const PURCHASE_MODE: PurchaseMode = "direct";

/**
 * Shopify tags that force a single product to be made-to-order even when
 * PURCHASE_MODE is "direct". Lets the shop flag specific bespoke pieces just by
 * tagging them in Shopify (e.g. add the tag `encargo`) — no code change needed.
 * Matching is case-insensitive.
 */
export const MADE_TO_ORDER_TAGS = [
  "encargo",
  "por-encargo",
  "por encargo",
  "por-orden",
  "por orden",
];

/** True when a piece must be ordered by consultation rather than bought online.
 *  Takes the product's Shopify tags: in "direct" mode a matching tag forces a
 *  single product to be made-to-order; in "made-to-order" mode everything is. */
export function isMadeToOrder(tags?: readonly string[]): boolean {
  if (PURCHASE_MODE === "made-to-order") return true;
  const normalized = (tags ?? []).map((t) => t.toLowerCase().trim());
  return MADE_TO_ORDER_TAGS.some((t) => normalized.includes(t));
}

/** True only when a piece can be added to cart and checked out online right now
 *  (i.e. not made-to-order AND actually in stock). Accepts any object carrying
 *  `tags` + `availableForSale` (a Product, a wishlist item, …). */
export function canBuyDirectly(product: {
  tags?: readonly string[];
  availableForSale?: boolean;
}): boolean {
  return !isMadeToOrder(product.tags) && product.availableForSale === true;
}

/** Label for the consultation / "pedir por encargo" call-to-action. */
export const CONSULT_LABEL = "Consultar por WhatsApp";

/**
 * Builds the WhatsApp consultation link. Reuses the brand number from `SITE`
 * (never hardcoded here) and prefills a message naming the piece, so the
 * workshop knows exactly what the customer is asking for.
 */
export function whatsappConsultUrl(product?: { title?: string }): string {
  const message = product?.title
    ? `Hola, me interesa esta pieza por encargo: "${product.title}". ¿Me pueden ayudar con los detalles y el precio?`
    : "Hola, quiero consultar por una pieza por encargo.";
  const sep = SITE.contact.whatsapp.includes("?") ? "&" : "?";
  return `${SITE.contact.whatsapp}${sep}text=${encodeURIComponent(message)}`;
}
