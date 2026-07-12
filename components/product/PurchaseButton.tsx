"use client";

import { useCart } from "@/lib/cart-context";
import { canBuyDirectly, CONSULT_LABEL, whatsappConsultUrl } from "@/lib/commerce";
import type { Product } from "@/lib/types";

// The single purchase control used across the storefront (product cards, shop
// listing). It reads the central commerce policy and renders either an
// add-to-cart button (when the piece is buyable online) or a WhatsApp
// consultation link (for made-to-order or out-of-stock pieces).
//
// `className` preserves each template's existing pill styling; `children` is the
// buy-state content. For icon-only buttons set `iconOnly` so the consult state
// keeps the icon (with a descriptive tooltip) instead of showing a text label.
export default function PurchaseButton({
  product,
  quantity = 1,
  className,
  children,
  iconOnly = false,
}: {
  product: Product;
  quantity?: number;
  className?: string;
  children: React.ReactNode;
  iconOnly?: boolean;
}) {
  const { addItem } = useCart();

  if (canBuyDirectly(product)) {
    return (
      <button
        type="button"
        className={className}
        title="Añadir al carrito"
        onClick={() => addItem(product, quantity)}
      >
        {children}
      </button>
    );
  }

  // Made-to-order (or out of stock) → route to a WhatsApp consultation.
  return (
    <a
      className={className}
      href={whatsappConsultUrl(product)}
      target="_blank"
      rel="noreferrer"
      title={CONSULT_LABEL}
    >
      {iconOnly ? children : CONSULT_LABEL}
    </a>
  );
}
