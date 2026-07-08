"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatMoney } from "@/lib/utils";
import { isShopifyCartEnabled, createShopifyCheckout } from "@/lib/shopify-cart";

const FIELDS: { name: string; label: string; type?: string; half?: boolean }[] = [
  { name: "firstName", label: "Nombre", half: true },
  { name: "lastName", label: "Apellido", half: true },
  { name: "company", label: "Empresa (opcional)" },
  { name: "address", label: "Dirección" },
  { name: "city", label: "Ciudad" },
  { name: "state", label: "Estado / Provincia" },
  { name: "postcode", label: "Código postal" },
  { name: "email", label: "Correo electrónico", type: "email" },
  { name: "phone", label: "Teléfono" },
];

export default function CheckoutView() {
  const { lines, subtotal, currencyCode, clear } = useCart();
  const [placed, setPlaced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fmt = (n: number) => formatMoney({ amount: String(n), currencyCode });
  const shopify = isShopifyCartEnabled();

  // Demo-only confirmation screen.
  if (placed) {
    return (
      <div className="checkout-area">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center" style={{ padding: "40px 0" }}>
              <h3 style={{ marginBottom: 12 }}>¡Gracias! Tu pedido se ha realizado.</h3>
              <p style={{ color: "#a99d83", marginBottom: 24 }}>
                Te enviamos una confirmación por correo. (Checkout de demostración —
                conecta Shopify para cobrar pagos reales.)
              </p>
              <Link href="/shop" className="hiraola-btn">
                Seguir comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="checkout-area">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center" style={{ padding: "40px 0" }}>
              <p style={{ marginBottom: 20 }}>
                Tu carrito está vacío — no hay nada que pagar.
              </p>
              <Link href="/shop" className="hiraola-btn">
                Volver a la tienda
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Order summary — shared by both the live and demo layouts.
  const orderTable = (
    <div className="your-order-table table-responsive">
      <table>
        <thead>
          <tr>
            <th className="product-name">Producto</th>
            <th className="product-total">Total</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr className="cart_item" key={l.id}>
              <td className="product-name">
                {l.title}{" "}
                <strong className="product-quantity"> × {l.quantity}</strong>
                {l.customization && (
                  <span className="cart-customization">
                    ✦ Grabado: «{l.customization.text}» · {l.customization.font}
                  </span>
                )}
              </td>
              <td className="product-total">
                <span className="amount">{fmt(l.price * l.quantity)}</span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="cart-subtotal">
            <th>Subtotal</th>
            <td>
              <span className="amount">{fmt(subtotal)}</span>
            </td>
          </tr>
          <tr className="order-total">
            <th>Total del pedido</th>
            <td>
              <strong>
                <span className="amount">{fmt(subtotal)}</span>
              </strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  // --- Live mode: Shopify handles address + payment on its hosted checkout. ---
  if (shopify) {
    async function goToShopifyCheckout() {
      setError(null);
      setLoading(true);
      try {
        const url = await createShopifyCheckout(lines);
        window.location.href = url; // Shopify hosted, PCI-secure checkout
      } catch {
        setError(
          "No pudimos iniciar el pago seguro. Revisa la conexión con Shopify e inténtalo de nuevo.",
        );
        setLoading(false);
      }
    }

    return (
      <div className="checkout-area">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 col-12">
              <div className="checkbox-form">
                <h3>Pago seguro</h3>
                <p style={{ color: "var(--dk-muted)", lineHeight: 1.75, marginTop: 8 }}>
                  Al continuar te llevamos al <strong>pago seguro de Shopify</strong>,
                  donde ingresas tu dirección y método de pago. Tu pedido — incluidas
                  las personalizaciones grabadas — llega directo al panel de la tienda.
                </p>
                {error && (
                  <p style={{ color: "#e2726d", marginTop: 14, fontSize: 14 }}>{error}</p>
                )}
              </div>
            </div>
            <div className="col-lg-6 col-12">
              <div className="your-order">
                <h3>Tu pedido</h3>
                {orderTable}
                <div className="payment-method">
                  <div className="order-button-payment">
                    <button
                      type="button"
                      className="hiraola-btn hiraola-btn_fullwidth"
                      onClick={goToShopifyCheckout}
                      disabled={loading}
                    >
                      {loading ? "Redirigiendo…" : "Proceder al pago seguro"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Demo mode: no Shopify configured, collect details locally and confirm. ---
  function onDemoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPlaced(true);
    clear();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="checkout-area">
      <div className="container">
        <form onSubmit={onDemoSubmit}>
          <div className="row">
            <div className="col-lg-6 col-12">
              <div className="checkbox-form">
                <h3>Datos de facturación</h3>
                <div className="row">
                  {FIELDS.map((f) => (
                    <div className={f.half ? "col-md-6" : "col-md-12"} key={f.name}>
                      <div className="checkout-form-list">
                        <label>
                          {f.label}{" "}
                          {!f.label.includes("opcional") && (
                            <span className="required">*</span>
                          )}
                        </label>
                        <input
                          type={f.type ?? "text"}
                          name={f.name}
                          required={!f.label.includes("opcional")}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-lg-6 col-12">
              <div className="your-order">
                <h3>Tu pedido</h3>
                {orderTable}
                <div className="payment-method">
                  <div className="order-button-payment">
                    <button type="submit" className="hiraola-btn hiraola-btn_fullwidth">
                      Realizar pedido
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
