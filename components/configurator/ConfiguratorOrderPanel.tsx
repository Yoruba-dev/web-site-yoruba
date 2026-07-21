"use client";

import { useState } from "react";
import type { RingSlotId } from "@/lib/odu";
import { getPlaceable, type PlacedItem } from "@/lib/symbols";
import { whatsappRingDesignUrl } from "@/lib/commerce";
import { useCart } from "@/lib/cart-context";
import { formatMoney } from "@/lib/utils";
import { designToPreviewDataUrl } from "@/lib/glyph-svg";

export type RingDesign = Record<RingSlotId, PlacedItem[]>;

export interface ConfiguratorVariant {
  id: string;
  title: string;
  amount: string;
  currencyCode: string;
}
export interface ConfiguratorProduct {
  handle: string;
  title: string;
  image: string;
  optionName?: string;
  variants: ConfiguratorVariant[];
}

const FACE_ORDER: { id: RingSlotId; label: string }[] = [
  { id: "front", label: "Frente" },
  { id: "right", label: "Lateral derecho" },
  { id: "left", label: "Lateral izquierdo" },
];

// Live summary + the way to order. Two modes:
//  • product tied (opened from a ring) → pick metal/size and "Agregar al carrito
//    y pagar" — the design rides along as line-item properties into the Shopify
//    order, so the sale is paid ON THE WEB.
//  • no product (general page) → WhatsApp consult.
export default function ConfiguratorOrderPanel({
  design,
  product,
  onReset,
}: {
  design: RingDesign;
  product?: ConfiguratorProduct;
  onReset: () => void;
}) {
  const { addLine, setCartOpen } = useCart();
  const [variantId, setVariantId] = useState(product?.variants[0]?.id ?? "");
  const [added, setAdded] = useState(false);

  const faces = FACE_ORDER.map((f) => ({
    ...f,
    names: (design[f.id] ?? [])
      .map((it) => getPlaceable(it.ref)?.name)
      .filter((n): n is string => Boolean(n)),
  }));
  const total = faces.reduce((n, f) => n + f.names.length, 0);
  const ready = total > 0;

  const chosen =
    product?.variants.find((v) => v.id === variantId) ?? product?.variants[0];

  function addToCart() {
    if (!product || !chosen || !ready) return;
    const properties = faces
      .filter((f) => f.names.length)
      .map((f) => ({ key: f.label, value: f.names.join(", ") }));
    const summary = faces
      .map((f) => `${f.label}: ${f.names.length ? f.names.join(", ") : "—"}`)
      .join(" | ");
    const uid =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${chosen.id}-${total}-${faces[0].names.length}`;
    const preview = designToPreviewDataUrl(design);

    addLine(
      {
        id: `${chosen.id}-ifa-${uid}`,
        merchandiseId: chosen.id,
        productHandle: product.handle,
        title: `${product.title} — diseño de Ifá${chosen.title && chosen.title !== "Default Title" ? ` (${chosen.title})` : ""}`,
        image: preview ?? product.image,
        price: Number(chosen.amount),
        currencyCode: chosen.currencyCode,
        properties,
        customization: { text: summary, font: "", preview },
      },
      1,
    );
    setAdded(true);
    setCartOpen(true);
  }

  const whatsappHref = whatsappRingDesignUrl(
    faces.map((f) => ({ label: f.label, items: f.names })),
    product ? { productTitle: product.title } : undefined,
  );

  return (
    <aside className="pyj-cfg_order" aria-label="Resumen de tu diseño">
      {product ? (
        <div className="pyj-cfg_prod">
          <span className="pyj-cfg_prod-eyebrow">Diseñando</span>
          <h2 className="pyj-cfg_order-title">{product.title}</h2>
          {chosen && (
            <span className="pyj-cfg_prod-price">
              {formatMoney({ amount: chosen.amount, currencyCode: chosen.currencyCode })}
            </span>
          )}
        </div>
      ) : (
        <h2 className="pyj-cfg_order-title">Tu diseño</h2>
      )}

      {product && product.variants.length > 1 && (
        <div className="pyj-cfg_variants" role="radiogroup" aria-label={product.optionName ?? "Opción"}>
          {product.variants.map((v) => (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={v.id === chosen?.id}
              className={`pyj-cfg_variant${v.id === chosen?.id ? " is-selected" : ""}`}
              onClick={() => setVariantId(v.id)}
            >
              {v.title}
            </button>
          ))}
        </div>
      )}

      <ul className="pyj-cfg_summary">
        {faces.map((f) => (
          <li key={f.id} className="pyj-cfg_summary-row">
            <span className="pyj-cfg_summary-face">{f.label}</span>
            {f.names.length ? (
              <span className="pyj-cfg_summary-odu">{f.names.join(", ")}</span>
            ) : (
              <span className="pyj-cfg_summary-empty">Sin símbolos</span>
            )}
          </li>
        ))}
      </ul>

      {product ? (
        <button
          type="button"
          className={`pyj-btn-gold pyj-cfg_cta${ready ? "" : " is-disabled"}`}
          onClick={addToCart}
          disabled={!ready}
        >
          {added ? "Añadido ✓ — ver carrito" : "Agregar al carrito y pagar"}
        </button>
      ) : (
        <a
          className={`pyj-btn-gold pyj-cfg_cta${ready ? "" : " is-disabled"}`}
          href={ready ? whatsappHref : undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!ready}
          onClick={(e) => {
            if (!ready) e.preventDefault();
          }}
        >
          Pedir mi diseño
        </a>
      )}

      {product && (
        <a className="pyj-cfg_altlink" href={whatsappHref} target="_blank" rel="noreferrer">
          o consultar por WhatsApp
        </a>
      )}

      <button type="button" className="pyj-cfg_reset" onClick={onReset} disabled={!ready}>
        Limpiar todo
      </button>

      <p className="pyj-cfg_disclaimer">
        Los signos de Ifá son herencia sagrada Yoruba/Lucumí. Su significado
        pertenece a la tradición y se revela en consulta con tu babaláwo — aquí
        honras tu signo como identidad. La pieza es una joya de autor, no un
        objeto consagrado.
      </p>
    </aside>
  );
}
