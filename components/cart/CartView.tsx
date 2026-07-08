"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatMoney } from "@/lib/utils";

export default function CartView() {
  const { lines, subtotal, currencyCode, removeItem, updateQty } = useCart();
  const fmt = (n: number) => formatMoney({ amount: String(n), currencyCode });

  if (lines.length === 0) {
    return (
      <div className="hiraola-cart-area">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center" style={{ padding: "40px 0" }}>
              <p style={{ marginBottom: 20 }}>Tu carrito está vacío.</p>
              <Link href="/shop" className="hiraola-btn">
                Volver a la tienda
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hiraola-cart-area">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="table-content table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th className="hiraola-product-remove">Quitar</th>
                    <th className="hiraola-product-thumbnail">Imagen</th>
                    <th className="cart-product-name">Producto</th>
                    <th className="hiraola-product-price">Precio</th>
                    <th className="hiraola-product-quantity">Cantidad</th>
                    <th className="hiraola-product-subtotal">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id}>
                      <td className="hiraola-product-remove">
                        <a onClick={() => removeItem(l.id)} style={{ cursor: "pointer" }}>
                          <i className="fa fa-trash" title="Quitar" />
                        </a>
                      </td>
                      <td className="hiraola-product-thumbnail">
                        <Link href={`/products/${l.productHandle}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={l.image} alt={l.title} />
                        </Link>
                      </td>
                      <td className="hiraola-product-name">
                        <Link href={`/products/${l.productHandle}`}>{l.title}</Link>
                        {l.customization && (
                          <span className="cart-customization">
                            ✦ Grabado: «{l.customization.text}» ·{" "}
                            {l.customization.font}
                            {l.customization.metal
                              ? ` · ${l.customization.metal}`
                              : ""}
                          </span>
                        )}
                      </td>
                      <td className="hiraola-product-price">
                        <span className="amount">{fmt(l.price)}</span>
                      </td>
                      <td className="quantity">
                        <label>Cantidad</label>
                        <div className="cart-plus-minus">
                          <input
                            className="cart-plus-minus-box"
                            type="text"
                            value={l.quantity}
                            readOnly
                          />
                          <div
                            className="dec qtybutton"
                            onClick={() => updateQty(l.id, l.quantity - 1)}
                          >
                            <i className="fa fa-angle-down" />
                          </div>
                          <div
                            className="inc qtybutton"
                            onClick={() => updateQty(l.id, l.quantity + 1)}
                          >
                            <i className="fa fa-angle-up" />
                          </div>
                        </div>
                      </td>
                      <td className="product-subtotal">
                        <span className="amount">{fmt(l.price * l.quantity)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row">
              <div className="col-12">
                <div className="coupon-all">
                  <div className="coupon">
                    <input
                      className="input-text"
                      name="coupon_code"
                      placeholder="Código de cupón"
                      type="text"
                    />
                    <input className="button" name="apply_coupon" value="Aplicar cupón" type="submit" />
                  </div>
                  <div className="coupon2">
                    <input className="button" name="update_cart" value="Actualizar carrito" type="submit" />
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-5 ml-auto">
                <div className="cart-page-total">
                  <h2>Resumen del carrito</h2>
                  <ul>
                    <li>
                      Subtotal <span>{fmt(subtotal)}</span>
                    </li>
                    <li>
                      Total <span>{fmt(subtotal)}</span>
                    </li>
                  </ul>
                  <Link href="/checkout">Finalizar compra</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
