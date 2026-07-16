import type { Money } from "./types";

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
};

/** Format money with a thousands separator: "$11,800.00". */
export function formatMoney(money: Money): string {
  const symbol = CURRENCY_SYMBOLS[money.currencyCode] ?? "";
  const value = Number(money.amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${value}`;
}

/** Build a Money object from a plain number. */
export function money(amount: number, currencyCode = "GBP"): Money {
  return { amount: amount.toFixed(2), currencyCode };
}

/** Ask the Shopify CDN for a `width`-sized (and web-transcoded, e.g. .heic→web)
 *  variant. The store's originals are full-resolution iPhone photos (often
 *  several MB) — every Shopify image URL, `<img>` or CSS background alike,
 *  must go through this before rendering (see SafeImage.tsx for the `<img>`
 *  case). No-op for non-Shopify URLs or a URL that already has a width. */
export function sizedImageUrl(src: string, width: number): string {
  if (!src.includes("cdn.shopify.com/")) return src;
  if (/[?&]width=/.test(src)) return src;
  return `${src}${src.includes("?") ? "&" : "?"}width=${width}`;
}
