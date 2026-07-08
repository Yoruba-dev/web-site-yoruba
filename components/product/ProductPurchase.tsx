"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useAccount } from "@/lib/account-context";
import CompareButton from "./CompareButton";
import WishlistButton from "./WishlistButton";
import type { Product } from "@/lib/types";

// Buy box ported from single-product.html (.quantity + .qty-btn_area), wired to
// the cart. Using <a class="qty-cart_btn"> so the template's button styling
// (dark → gold on hover) applies exactly.
export default function ProductPurchase({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { isLoggedIn, hydrated } = useAccount();
  const [qty, setQty] = useState(1);

  return (
    <>
      <div className="quantity">
        <label>Cantidad</label>
        <div className="cart-plus-minus">
          <input className="cart-plus-minus-box" type="text" value={qty} readOnly />
          <div className="dec qtybutton" onClick={() => setQty((q) => Math.max(1, q - 1))}>
            <i className="fa fa-angle-down" />
          </div>
          <div className="inc qtybutton" onClick={() => setQty((q) => q + 1)}>
            <i className="fa fa-angle-up" />
          </div>
        </div>
      </div>
      <div className="qty-btn_area">
        <ul>
          <li>
            <a
              className="qty-cart_btn"
              style={{ cursor: "pointer" }}
              onClick={() => addItem(product, qty)}
            >
              Añadir al carrito
            </a>
          </li>
          <li>
            <WishlistButton className="qty-wishlist_btn" product={product} />
          </li>
          <li>
            <CompareButton className="qty-compare_btn" product={product} />
          </li>
        </ul>
      </div>
      {hydrated && isLoggedIn && (
        <Link
          href={`/personalizar?handle=${product.handle}`}
          className="cz-product-btn"
        >
          ✦ Personalizar con grabado 3D
        </Link>
      )}
    </>
  );
}
