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
