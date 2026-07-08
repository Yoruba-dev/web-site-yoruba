import type { Money } from "./types";

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
};

/** Format money the way the template does: "£120.80". */
export function formatMoney(money: Money): string {
  const symbol = CURRENCY_SYMBOLS[money.currencyCode] ?? "";
  const value = Number(money.amount).toFixed(2);
  return `${symbol}${value}`;
}

/** Build a Money object from a plain number. */
export function money(amount: number, currencyCode = "GBP"): Money {
  return { amount: amount.toFixed(2), currencyCode };
}
