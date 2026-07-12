"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import {
  canBuyDirectly,
  CONSULT_LABEL,
  isMadeToOrder,
  whatsappConsultUrl,
} from "@/lib/commerce";
import CompareButton from "./CompareButton";
import WishlistButton from "./WishlistButton";
import type { Product } from "@/lib/types";

// Buy box wired to the central commerce policy (lib/commerce.ts): pieces that
// can be bought online show the quantity + add-to-cart control; made-to-order
// (or out-of-stock) pieces show a WhatsApp consultation CTA so the workshop
// confirms specs (size, karat, Orisha) before any order — preventing wrong
// orders. Wishlist + Compare stay available in every state.
export default function ProductPurchase({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);

  const buyable = canBuyDirectly(product);

  return (
    <>
      {buyable && (
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
      )}

      {!buyable && (
        <p
          style={{
            color: "#a99d83",
            fontSize: 14,
            lineHeight: 1.6,
            margin: "0 0 18px",
            maxWidth: 560,
          }}
        >
          {isMadeToOrder(product.tags)
            ? "Esta pieza se hace por encargo. Escríbenos por WhatsApp para confirmar medidas, quilate y detalles antes de tu pedido."
            : "Pieza agotada por ahora. Escríbenos por WhatsApp y te avisamos o la hacemos por encargo."}
        </p>
      )}

      <div className="qty-btn_area">
        <ul>
          <li>
            {buyable ? (
              <a
                className="qty-cart_btn"
                style={{ cursor: "pointer" }}
                onClick={() => addItem(product, qty)}
              >
                Añadir al carrito
              </a>
            ) : (
              <a
                className="qty-cart_btn"
                href={whatsappConsultUrl(product)}
                target="_blank"
                rel="noreferrer"
              >
                {CONSULT_LABEL}
              </a>
            )}
          </li>
          <li>
            <WishlistButton className="qty-wishlist_btn" product={product} />
          </li>
          <li>
            <CompareButton className="qty-compare_btn" product={product} />
          </li>
        </ul>
      </div>
    </>
  );
}
