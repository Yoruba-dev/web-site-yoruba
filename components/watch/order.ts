// ---------------------------------------------------------------------------
// El PEDIDO del creador: todo lo que el resumen y el pie fijo necesitan saber
// para pedir un reloj, calculado en un solo sitio (puro, sin React).
//
// Hoy NO hay producto en Shopify (decisión del dueño §1/§11): el botón es
// "Solicitar mi reloj" → WhatsApp con el enlace /diseno?d=… y el precio dice
// "Precio por confirmar". El camino del carrito queda listo y DORMIDO: solo se
// enciende cuando llega un producto etiquetado `reloj-personalizable`, una
// variante coincide con Acabado × Correa (variantFor) y canBuyDirectly la deja
// pasar (precio real, no el $1 de marcador, y disponible).
// ---------------------------------------------------------------------------
import {
  WATCH_ORDER_LABEL,
  canBuyDirectly,
  isWatchConfigurable,
  whatsappShareDesignUrl,
  whatsappWatchDesignUrl,
} from "../../lib/commerce";
import { encodeWatchDesign } from "../../lib/design-code";
import { SITE_URL } from "../../lib/site";
import { formatMoney } from "../../lib/utils";
import {
  WATCH_PRICE_TBD,
  designCode,
  summary,
  validate,
  variantFor,
  type Validation,
  type WatchConfig,
  type WatchVariantLike,
} from "../../lib/watch";

/** El producto de Shopify del reloj, cuando exista (hoy: nunca). */
export interface WatchProductVM {
  handle: string;
  title: string;
  image: string;
  tags: string[];
  variants: (WatchVariantLike & {
    availableForSale: boolean;
    price: { amount: string; currencyCode: string };
  })[];
}

export interface OrderInfo {
  /** "PY-R-7K3Q" */
  code: string;
  /** El valor de ?d= (el reloj entero, normalizado). */
  d: string;
  /** SITE_URL/diseno?d=… — la hoja del taller (va en el pedido). */
  sheetUrl: string;
  /** SITE_URL/creador-de-relojes?d=… — para compartir y reabrir. */
  creatorUrl: string;
  /** WhatsApp a la tienda con el código, el resumen y el enlace. */
  whatsappHref: string;
  /** WhatsApp sin destinatario (el padrino, la familia). */
  shareHref: string;
  validation: Validation;
  /** true solo con producto real + variante + canBuyDirectly. */
  canBuy: boolean;
  /** "Precio por confirmar" o el precio de la variante. */
  priceLabel: string;
  ctaLabel: string;
  variant: WatchProductVM["variants"][number] | null;
}

/** `final` = el reloj YA normalizado (normalize()): sin espacios sueltos y
 *  exactamente lo que se reconstruye desde el enlace. */
export function buildOrderInfo(final: WatchConfig, product?: WatchProductVM | null): OrderInfo {
  const code = designCode(final);
  const d = encodeWatchDesign(final, product ? { handle: product.handle, title: product.title } : undefined);
  const sheetUrl = `${SITE_URL}/diseno?d=${d}`;
  const creatorUrl = `${SITE_URL}/creador-de-relojes?${product ? `reloj=${encodeURIComponent(product.handle)}&` : ""}d=${d}`;
  const validation = validate(final);
  const variant = product && isWatchConfigurable(product) ? variantFor(final, product.variants) : null;
  const canBuy =
    !!product &&
    !!variant &&
    canBuyDirectly({ tags: product.tags, availableForSale: variant.availableForSale === true, price: variant.price });
  return {
    code,
    d,
    sheetUrl,
    creatorUrl,
    whatsappHref: whatsappWatchDesignUrl(code, sheetUrl, summary(final)),
    shareHref: whatsappShareDesignUrl(code, creatorUrl),
    validation,
    canBuy,
    priceLabel: canBuy && variant ? formatMoney(variant.price) : WATCH_PRICE_TBD,
    ctaLabel: WATCH_ORDER_LABEL,
    variant: canBuy ? variant : null,
  };
}
