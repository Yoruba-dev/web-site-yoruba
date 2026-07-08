"use client";

import { useCompare } from "@/lib/compare-context";
import type { Product } from "@/lib/types";

// Toggles a product in the comparison list. Renders an <a> so it inherits the
// template's existing button styling (.qty-compare_btn / .hiraola-add_compare),
// and reflects state with an `.in-compare` class.
export default function CompareButton({
  product,
  className,
  children,
  title,
}: {
  product: Product;
  className?: string;
  children?: React.ReactNode;
  title?: string;
}) {
  const { has, toggle, full } = useCompare();
  const active = has(product.id);
  const disabled = !active && full;

  return (
    <a
      className={`${className ?? ""}${active ? " in-compare" : ""}`}
      role="button"
      aria-pressed={active}
      title={
        active
          ? "Quitar de comparar"
          : disabled
            ? "Máximo 4 productos para comparar"
            : (title ?? "Comparar este producto")
      }
      onClick={() => {
        if (!disabled) toggle(product);
      }}
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children ?? <i className="ion-ios-shuffle-strong" />}
    </a>
  );
}
