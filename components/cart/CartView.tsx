"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import type { PromoVM } from "@/lib/promo";
import { formatMoney } from "@/lib/utils";
import SafeImage from "@/components/ui/SafeImage";

export default function CartView({ promo }: { promo?: PromoVM | null }) {
  const { lines, subtotal, currencyCode, removeItem, updateQty } = useCart();

  // La oferta cruzada, reflejada en el resumen. Se enseña el ahorro solo cuando
  // están LAS DOS piezas, que es cuando Shopify lo aplica de verdad: prometer
  // un descuento que luego no aparece al pagar es peor que no prometer nada.
  const llevaAnillo = !!promo && lines.some((l) =>
    promo.gatilloHandles.includes(l.productHandle),
  );
  const llevaMoneda = !!promo && lines.some(
    (l) => l.merchandiseId === promo.regalo.variantId || l.id === promo.regalo.variantId,
  );
  const ofertaActiva = llevaAnillo && llevaMoneda;
  const ahorroNum = ofertaActiva
    ? promo.regalo.precio - Number(promo.ahora.replace(/[^0-9.]/g, ""))
    : 0;
  const fmt = (n: number) => formatMoney({ amount: String(n), currencyCode });

  if (lines.length === 0) {
    return (
      <div className="hiraola-cart-area">
        <div className="container">
          <div className="pyj-empty">
            <p>Tu carrito está vacío.</p>
            <Link href="/shop-left-sidebar" className="pyj-btn-gold">
              Ver la colección
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hiraola-cart-area">
      <div className="container">
        <div className="pyj-cart">
          {/* Line items — one elegant card per piece (no table borders). */}
          <div className="pyj-cart-lines">
            {lines.map((l) => (
              <div className="pyj-cart-line" key={l.id}>
                <div className="pyj-cart-thumbs">
                  <Link href={`/products/${l.productHandle}`} className="pyj-cart-thumb">
                    <SafeImage src={l.image} width={300} alt={l.title} />
                  </Link>
                  {l.customization?.preview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="pyj-cart-design"
                      src={l.customization.preview}
                      alt="Tu diseño de Ifá"
                      loading="lazy"
                    />
                  )}
                </div>

                <div className="pyj-cart-info">
                  <Link href={`/products/${l.productHandle}`} className="pyj-cart-title">
                    {l.title}
                  </Link>
                  {l.customization && (
                    <span className="pyj-cart-note">
                      ✦ Grabado: «{l.customization.text}»
                      {l.customization.font ? ` · ${l.customization.font}` : ""}
                      {l.customization.metal ? ` · ${l.customization.metal}` : ""}
                    </span>
                  )}
                  <span className="pyj-cart-unit">{fmt(l.price)} c/u</span>
                </div>

                <div className="pyj-cart-qty">
                  <button
                    type="button"
                    aria-label="Quitar uno"
                    onClick={() => updateQty(l.id, l.quantity - 1)}
                  >
                    <i className="fa fa-minus" />
                  </button>
                  <span>{l.quantity}</span>
                  <button
                    type="button"
                    aria-label="Añadir uno"
                    onClick={() => updateQty(l.id, l.quantity + 1)}
                  >
                    <i className="fa fa-plus" />
                  </button>
                </div>

                <div className="pyj-cart-sub">{fmt(l.price * l.quantity)}</div>

                <button
                  type="button"
                  className="pyj-cart-remove"
                  aria-label="Quitar del carrito"
                  onClick={() => removeItem(l.id)}
                >
                  <i className="fa fa-times" />
                </button>
              </div>
            ))}
          </div>

          {/* Summary panel */}
          <aside className="pyj-cart-summary">
            <h2>Resumen del pedido</h2>
            <div className="pyj-sum-row">
              <span>Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            {ofertaActiva && promo && (
              <div className="pyj-sum-row pyj-sum-oferta">
                <span>Oferta del mes · moneda</span>
                <span>−{fmt(ahorroNum)}</span>
              </div>
            )}
            {llevaAnillo && !llevaMoneda && promo && (
              <p className="pyj-sum-aviso">
                Añade la <strong>{promo.regalo.title}</strong> y te sale a{" "}
                <strong>{promo.ahora}</strong> en vez de {promo.antes}.
              </p>
            )}
            <div className="pyj-sum-row muted">
              <span>Envío</span>
              <span>Se calcula al finalizar</span>
            </div>
            <div className="pyj-sum-row total">
              <span>Total</span>
              <span>{fmt(subtotal - ahorroNum)}</span>
            </div>
            <Link href="/checkout" className="pyj-btn-gold pyj-cart-checkout">
              Finalizar compra
            </Link>
            <Link href="/shop-left-sidebar" className="pyj-cart-continue">
              ← Seguir comprando
            </Link>
            <p className="pyj-cart-trust">
              ✦ Pago seguro · Hecho a mano en Miami · Garantía de por vida
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
