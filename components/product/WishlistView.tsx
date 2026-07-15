"use client";

import Link from "next/link";
import { useWishlist, type WishlistItem } from "@/lib/wishlist-context";
import { useCart } from "@/lib/cart-context";
import {
  CONSULT_LABEL,
  CONSULT_PRICE_LABEL,
  isMadeToOrder,
  isPlaceholderPriced,
  whatsappConsultUrl,
} from "@/lib/commerce";
import { formatMoney } from "@/lib/utils";

export default function WishlistView() {
  const { items, remove } = useWishlist();
  const { addLine } = useCart();
  const fmt = (n: number, c: string) =>
    formatMoney({ amount: String(n), currencyCode: c });
  // $0/$1 placeholder → route to a WhatsApp consult, never a $0 checkout.
  const isPlaceholder = (it: WishlistItem) =>
    isPlaceholderPriced({ amount: String(it.price), currencyCode: it.currencyCode });

  function moveToCart(it: WishlistItem) {
    addLine({
      id: it.variantId,
      productHandle: it.handle,
      title: it.title,
      image: it.image,
      price: it.price,
      currencyCode: it.currencyCode,
    });
  }

  if (items.length === 0) {
    return (
      <div className="hiraola-wishlist_area">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center" style={{ padding: "50px 0" }}>
              <p style={{ marginBottom: 20 }}>
                Tu lista de favoritos está vacía. Pulsa el corazón{" "}
                <i className="ion-android-favorite-outline" /> en cualquier producto
                para guardarlo aquí.
              </p>
              <Link href="/shop-left-sidebar" className="hiraola-btn">
                Ir a la tienda
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hiraola-wishlist_area">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="table-content table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th className="hiraola-product_remove">Quitar</th>
                    <th className="hiraola-product-thumbnail">Imagen</th>
                    <th className="cart-product-name">Producto</th>
                    <th className="hiraola-product-price">Precio</th>
                    <th className="hiraola-product-stock-status">Disponibilidad</th>
                    <th className="hiraola-cart_btn">Añadir</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td className="hiraola-product_remove">
                        <a onClick={() => remove(it.id)} style={{ cursor: "pointer" }}>
                          <i className="fa fa-trash" title="Quitar" />
                        </a>
                      </td>
                      <td className="hiraola-product-thumbnail">
                        <Link href={`/products/${it.handle}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={it.image} alt={it.title} />
                        </Link>
                      </td>
                      <td className="hiraola-product-name">
                        <Link href={`/products/${it.handle}`}>{it.title}</Link>
                      </td>
                      <td className="hiraola-product-price">
                        <span className="amount">
                          {isPlaceholder(it)
                            ? CONSULT_PRICE_LABEL
                            : fmt(it.price, it.currencyCode)}
                        </span>
                      </td>
                      <td className="hiraola-product-stock-status">
                        {it.available ? (
                          <span className="in-stock">En stock</span>
                        ) : (
                          <span className="out-stock">Agotado</span>
                        )}
                      </td>
                      <td className="hiraola-product_add-cart">
                        {isMadeToOrder(it.tags) || isPlaceholder(it) ? (
                          <a
                            className="hiraola-cart_btn"
                            href={whatsappConsultUrl({
                              title: it.title,
                              handle: it.handle,
                            })}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {CONSULT_LABEL}
                          </a>
                        ) : it.available ? (
                          <a
                            className="hiraola-cart_btn"
                            onClick={() => moveToCart(it)}
                            style={{ cursor: "pointer" }}
                          >
                            Añadir al carrito
                          </a>
                        ) : (
                          <Link
                            className="hiraola-cart_btn"
                            href={`/products/${it.handle}`}
                          >
                            Ver pieza
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
