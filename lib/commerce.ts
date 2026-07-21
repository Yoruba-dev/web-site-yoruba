import { SITE, SITE_URL } from "./site";
import type { Money } from "./types";
import { formatMoney } from "./utils";
import { RING_SLOTS, getOdu, type RingConfig } from "./odu";

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

/** Tags that mark a ring as customizable in the /configurador editor — the
 *  product page then shows a "Diseña este anillo" entry that opens the editor
 *  tied to that piece. Tag a product with any of these in Shopify to enable it. */
export const CONFIGURABLE_TAGS = ["personalizable", "configurable"];

/** True when a piece can be personalised in the ring configurator. */
export function isConfigurable(tags?: readonly string[]): boolean {
  const normalized = (tags ?? []).map((t) => t.toLowerCase().trim());
  return CONFIGURABLE_TAGS.some((t) => normalized.includes(t));
}

/** Internal control tags that steer behaviour but must NEVER be shown to shoppers
 *  (as a category, in the "Etiquetas" list, etc.). Case-insensitive. */
const CONTROL_TAGS = new Set([
  ...MADE_TO_ORDER_TAGS,
  "color-orisha",
  ...CONFIGURABLE_TAGS,
]);

/** A product's tags with internal control tags stripped — safe to display. */
export function publicTags(tags?: readonly string[]): string[] {
  return (tags ?? []).filter((t) => !CONTROL_TAGS.has(t.toLowerCase().trim()));
}

/** True when a piece must be ordered by consultation rather than bought online.
 *  Takes the product's Shopify tags: in "direct" mode a matching tag forces a
 *  single product to be made-to-order; in "made-to-order" mode everything is. */
export function isMadeToOrder(tags?: readonly string[]): boolean {
  if (PURCHASE_MODE === "made-to-order") return true;
  const normalized = (tags ?? []).map((t) => t.toLowerCase().trim());
  return MADE_TO_ORDER_TAGS.some((t) => normalized.includes(t));
}

/**
 * Prices at or below this ($) are PLACEHOLDERS, not real prices — a piece whose
 * price hasn't been set in Shopify yet comes through as 0 or 1. Such pieces must
 * NEVER be checked out online (someone could buy a $4,800 piece for $1) → they
 * always route to a WhatsApp consultation and show "a consultar" instead of a
 * price. Change the threshold here to adjust the rule everywhere at once.
 */
export const PLACEHOLDER_PRICE_MAX = 1;

/** Label shown in place of a real price for placeholder-priced pieces. */
export const CONSULT_PRICE_LABEL = "Precio a consultar";

/** True when a price is a placeholder (≤ PLACEHOLDER_PRICE_MAX), i.e. not real. */
export function isPlaceholderPriced(price?: Money | null): boolean {
  if (!price) return false;
  const n = Number(price.amount);
  return Number.isFinite(n) && n <= PLACEHOLDER_PRICE_MAX;
}

/** True only when a piece can be added to cart and checked out online right now:
 *  not made-to-order, has a REAL price (not a $0/$1 placeholder), AND in stock.
 *  Accepts any object carrying `tags` + `availableForSale` + `price` (a Product,
 *  a wishlist item, a selected variant, …). */
export function canBuyDirectly(product: {
  tags?: readonly string[];
  availableForSale?: boolean;
  price?: Money | null;
}): boolean {
  return (
    !isMadeToOrder(product.tags) &&
    !isPlaceholderPriced(product.price) &&
    product.availableForSale === true
  );
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
  opts?: { karat?: boolean; color?: string },
): string {
  const price = variant?.price ?? product?.price;
  const lines: string[] = [
    "Hola 👋 Quiero hacer un *pedido especial desde la web* de Pedro Yoruba Jewelry.",
    "",
  ];
  if (product?.title) lines.push(`📿 Pieza: ${product.title}`);
  if (variant?.title) lines.push(`📏 Tamaño / medida: ${variant.title}`);
  if (opts?.color?.trim()) lines.push(`🎨 Color / Orisha: ${opts.color.trim()}`);
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

/** Label for the ring-configurator call-to-action. */
export const RING_CONFIG_LABEL = "Pedir mi diseño por WhatsApp";

/**
 * Builds the WhatsApp link for a CUSTOM RING designed in the /configurador —
 * lists the chosen Odù on each face (frente + laterales) plus optional metal and
 * size, and (optionally) links back to the shared design so the workshop can
 * reopen it. Same brand-number + prefill pattern as `whatsappConsultUrl`, so the
 * "diseña → pide" flow stays consistent with the rest of the encargo journey.
 */
export function whatsappRingConfigUrl(
  config: RingConfig,
  opts?: { karat?: string; size?: string; shareUrl?: string },
): string {
  const lines: string[] = [
    "Hola 👋 Diseñé un *anillo personalizado* en la web de Pedro Yoruba Jewelry.",
    "",
    "Signos de Ifá elegidos:",
  ];
  for (const slot of RING_SLOTS) {
    const id = config[slot.id];
    const odu = id ? getOdu(id) : undefined;
    lines.push(`• ${slot.short}: ${odu ? odu.name : "—"}`);
  }
  if (opts?.karat?.trim()) {
    lines.push("");
    lines.push(`Oro: ${opts.karat.trim()}`);
  }
  if (opts?.size?.trim()) lines.push(`Medida: ${opts.size.trim()}`);
  if (opts?.shareUrl?.trim()) {
    lines.push("");
    lines.push(`🔗 Mi diseño: ${opts.shareUrl.trim()}`);
  }
  lines.push("");
  lines.push("¿Me ayudan a cotizarlo y coordinar el pedido?");
  const message = lines.join("\n");
  const sep = SITE.contact.whatsapp.includes("?") ? "&" : "?";
  return `${SITE.contact.whatsapp}${sep}text=${encodeURIComponent(message)}`;
}

/**
 * WhatsApp link for a FREE-FORM ring design (the /configurador editor): lists the
 * symbols placed on each face. `faces` is already resolved to display names, so
 * this stays free of the symbol/Odù data model. Same brand-number + prefill
 * pattern as the other builders.
 */
export function whatsappRingDesignUrl(
  faces: { label: string; items: string[] }[],
  opts?: { productTitle?: string; shareUrl?: string },
): string {
  const lines: string[] = [
    "Hola 👋 Diseñé un *anillo personalizado* en la web de Pedro Yoruba Jewelry.",
    "",
  ];
  if (opts?.productTitle?.trim()) {
    lines.push(`Anillo: ${opts.productTitle.trim()}`, "");
  }
  lines.push("Mi diseño:");
  for (const f of faces) {
    lines.push(`• ${f.label}: ${f.items.length ? f.items.join(", ") : "—"}`);
  }
  if (opts?.shareUrl?.trim()) {
    lines.push("", `🔗 ${opts.shareUrl.trim()}`);
  }
  lines.push("", "¿Me ayudan a cotizarlo y coordinar el pedido?");
  const message = lines.join("\n");
  const sep = SITE.contact.whatsapp.includes("?") ? "&" : "?";
  return `${SITE.contact.whatsapp}${sep}text=${encodeURIComponent(message)}`;
}
