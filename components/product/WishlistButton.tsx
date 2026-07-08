"use client";

import { useWishlist } from "@/lib/wishlist-context";
import type { Product } from "@/lib/types";

// Toggles a product in the wishlist. The heart fills in (and turns gold via the
// `.in-wishlist` class) when the product is saved, so the state is obvious. Renders
// an <a> to inherit the template's button styling.
export default function WishlistButton({
  product,
  className,
  title,
}: {
  product: Product;
  className?: string;
  title?: string;
}) {
  const { has, toggle } = useWishlist();
  const active = has(product.id);

  return (
    <a
      className={`${className ?? ""}${active ? " in-wishlist" : ""}`}
      role="button"
      aria-pressed={active}
      title={active ? "Quitar de favoritos" : (title ?? "Añadir a favoritos")}
      onClick={() => toggle(product)}
      style={{ cursor: "pointer" }}
    >
      <i className={active ? "ion-android-favorite" : "ion-android-favorite-outline"} />
    </a>
  );
}
