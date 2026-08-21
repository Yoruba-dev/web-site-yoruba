"use client";

import { useState } from "react";
import type { CartLine } from "@/lib/cart-context";
import { createShopifyCheckout, isShopifyCartEnabled } from "@/lib/shopify-cart";
import { leerCodigoGuardado } from "@/lib/discount";

/**
 * "Comprar ahora" — straight to Shopify's checkout, skipping the cart.
 *
 * A shopper who already knows what they want should not have to add to cart,
 * open the drawer, then hunt for checkout. This builds a one-line Shopify cart
 * and sends them to the hosted checkout in a single click — the same thing
 * Amazon's "Buy now" does beside "Add to cart".
 *
 * The LOCAL cart is deliberately left alone: if the shopper abandons the
 * checkout they come back to whatever they already had, not to a surprise extra
 * item they never chose to keep.
 *
 * `buildLine` is owned by the CALLER, not by this button, because the product
 * page already resolves the selected variant, the quantity and the required
 * Color/Orisha choice. Returning null means "validation failed" (the caller has
 * shown its own error) and nothing happens — that keeps one source of truth for
 * what a valid purchase is, instead of a second copy that can drift.
 */
export default function BuyNowButton({
  buildLine,
  className = "pyj-buynow",
  label = "Comprar ahora",
}: {
  buildLine: () => CartLine | null;
  className?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  // Without Shopify credentials there is no hosted checkout to send anyone to,
  // and a button that cannot work is worse than no button.
  if (!isShopifyCartEnabled()) return null;

  async function go() {
    const line = buildLine();
    if (!line) return;
    setBusy(true);
    setFailed(false);
    try {
      // El código de campaña también vale por aquí. "Comprar ahora" se salta el
      // carrito, así que si no se pasa a mano, quien llegó por un enlace con
      // descuento pagaba el precio entero — justo después de leer "tu descuento
      // está guardado".
      const url = await createShopifyCheckout([line], leerCodigoGuardado());
      window.location.href = url;
    } catch {
      // Never strand the shopper on a spinner. Add-to-cart still works, so say so.
      setBusy(false);
      setFailed(true);
    }
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={go}
        disabled={busy}
        aria-busy={busy}
      >
        {busy ? "Abriendo el pago…" : label}
      </button>
      {failed && (
        <p className="pyj-buynow_error" role="alert">
          No pudimos abrir el pago. Inténtalo otra vez o añade la pieza al carrito.
        </p>
      )}
    </>
  );
}
