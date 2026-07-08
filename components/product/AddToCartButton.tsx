"use client";

import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/types";

// Small client island so ProductCard can stay a server component.
export default function AddToCartButton({
  product,
  quantity = 1,
  className,
  title = "Add To Cart",
  children,
}: {
  product: Product;
  quantity?: number;
  className?: string;
  title?: string;
  children: React.ReactNode;
}) {
  const { addItem } = useCart();
  return (
    <button
      type="button"
      className={className}
      title={title}
      onClick={() => addItem(product, quantity)}
    >
      {children}
    </button>
  );
}
