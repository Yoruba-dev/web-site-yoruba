import { SITE } from "./site";
import type { Money } from "./types";
import { formatMoney } from "./utils";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://pedrojewelryyoruba.com";

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
 * Builds the WhatsApp order/consultation link. Reuses the brand number from
 * `SITE` (never hardcoded here) and prefills a message that is clearly headed as
 * a *special order placed from the website*, and — when a variant is selected —
 * carries the exact chosen size/measurements, price and a link back to the
 * piece, so the workshop receives an unambiguous, ready-to-process order.
 *
 * Backward compatible: passing just `{ title }` (e.g. from a product card or
 * wishlist row) still produces a valid message.
 */
export function whatsappConsultUrl(
  product?: { title?: string; handle?: string; price?: Money },
  variant?: { title?: string; price?: Money },
  opts?: { karat?: boolean },
): string {
  const price = variant?.price ?? product?.price;
  const lines: string[] = [
    "Hola 👋 Quiero hacer un *pedido especial desde la web* de Pedro Yoruba Jewelry.",
    "",
  ];
  if (product?.title) lines.push(`📿 Pieza: ${product.title}`);
  if (variant?.title) lines.push(`📏 Tamaño / medida: ${variant.title}`);
  if (price) lines.push(`💰 Precio: ${formatMoney(price)}`);
  if (product?.handle) lines.push(`🔗 ${SITE_URL}/products/${product.handle}`);
  if (opts?.karat) {
    lines.push("");
    lines.push("Me gustaría en oro de *14k / 18k* (por encargo).");
  }
  lines.push("");
  lines.push("¿Me ayudan a coordinar los detalles del pedido?");
  const message = lines.join("\n");
  const sep = SITE.contact.whatsapp.includes("?") ? "&" : "?";
  return `${SITE.contact.whatsapp}${sep}text=${encodeURIComponent(message)}`;
}

/** Label for the wholesale / mayoreo call-to-action. */
export const WHOLESALE_LABEL = "Escríbenos por WhatsApp";

/**
 * Builds the WhatsApp link for the WHOLESALE (mayoreo) channel — the B2B route
 * for botánicas, santeros and shops that buy to resell. Prefills a message that
 * is clearly headed as a wholesale enquiry so it lands tagged and doesn't get
 * confused with a normal retail order. Reuses the brand number from `SITE`.
 */
export function whatsappWholesaleUrl(): string {
  const message = [
    "Hola 👋 Escribo por *mayoreo / compra al por mayor* en Pedro Yoruba Jewelry.",
    "",
    "Tengo una botánica / tienda y me interesa revender sus piezas.",
    "¿Me comparten el catálogo y los precios de mayorista?",
  ].join("\n");
  const sep = SITE.contact.whatsapp.includes("?") ? "&" : "?";
  return `${SITE.contact.whatsapp}${sep}text=${encodeURIComponent(message)}`;
}
