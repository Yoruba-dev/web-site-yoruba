// ---------------------------------------------------------------------------
// El PEDIDO del creador: todo lo que "Listo" y el pie necesitan saber
// para pedir un reloj, calculado en un solo sitio (puro, sin React).
//
// Hoy NO hay producto en Shopify (decisión del dueño §1/§11): el botón es
// "Solicitar por WhatsApp" → WhatsApp con el enlace /diseno?d=… y el precio dice
// "Precio por confirmar". El camino del carrito queda listo y DORMIDO: solo se
// enciende cuando llega un producto etiquetado `reloj-personalizable`, una
// variante coincide con Acabado × Correa (variantFor) y canBuyDirectly la deja
// pasar (precio real, no el $1 de marcador, y disponible).
// ---------------------------------------------------------------------------
import {
  canBuyDirectly,
  isWatchConfigurable,
  watchDesignMessage,
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
  /** {origen}/diseno?d=… — la hoja del taller (va en el pedido). */
  sheetUrl: string;
  /** {origen}/creador-de-relojes?d=…&paso=resumen — para compartir y reabrir
   *  (se abre en "Listo", con todas las piezas reales). */
  creatorUrl: string;
  /** WhatsApp a la tienda con el código, el resumen y el enlace. */
  whatsappHref: string;
  /** El texto exacto de ese WhatsApp ("¿No se abrió? Copiar mensaje"). */
  whatsappText: string;
  /** true si el origen es este equipo o la red local (localhost, 192.168.…):
   *  el enlace solo abre aquí (vista de prueba). */
  origenLocal: boolean;
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

/** Etiqueta del botón de pedir mientras no hay producto (WhatsApp). */
export const WATCH_REQUEST_LABEL = "Solicitar por WhatsApp";

/** ¿Este origen solo abre en este equipo o en la red local? */
export function isLocalOrigin(origin: string): boolean {
  let host = "";
  try {
    host = new URL(origin).hostname.toLowerCase();
  } catch {
    return false;
  }
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host === "[::1]" || host === "::1") return true;
  const ip = host.split(".").map(Number);
  if (ip.length !== 4 || ip.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = ip;
  return a === 127 || a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31) || (a === 169 && b === 254);
}

/** `final` = el reloj YA normalizado (normalize()): sin espacios sueltos y
 *  exactamente lo que se reconstruye desde el enlace. `origin` = de dónde
 *  salen los enlaces: SITE_URL por defecto (servidor, y tras el lanzamiento);
 *  antes del lanzamiento el editor pasa location.origin, así el enlace que se
 *  comparte abre en el mismo despliegue en el que se diseñó. */
export function buildOrderInfo(final: WatchConfig, product?: WatchProductVM | null, origin: string = SITE_URL): OrderInfo {
  const base = origin.replace(/\/+$/, "") || SITE_URL;
  const code = designCode(final);
  const d = encodeWatchDesign(final, product ? { handle: product.handle, title: product.title } : undefined);
  const sheetUrl = `${base}/diseno?d=${d}`;
  const creatorUrl = `${base}/creador-de-relojes?${product ? `reloj=${encodeURIComponent(product.handle)}&` : ""}d=${d}&paso=resumen`;
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
    whatsappText: watchDesignMessage(code, sheetUrl, summary(final)),
    origenLocal: isLocalOrigin(base),
    shareHref: whatsappShareDesignUrl(code, creatorUrl),
    validation,
    canBuy,
    priceLabel: canBuy && variant ? formatMoney(variant.price) : WATCH_PRICE_TBD,
    ctaLabel: canBuy ? "Añadir al carrito" : WATCH_REQUEST_LABEL,
    variant: canBuy ? variant : null,
  };
}
