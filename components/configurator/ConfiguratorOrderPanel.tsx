"use client";

import { useState } from "react";
import { getPlaceable, type PlacedItem } from "@/lib/symbols";
import { CONSULT_PRICE_LABEL, canBuyDirectly, whatsappRingDesignUrl } from "@/lib/commerce";
import { useCart } from "@/lib/cart-context";
import { formatMoney } from "@/lib/utils";
import { designToPreviewDataUrl } from "@/lib/glyph-svg";
import { encodeDesign } from "@/lib/design-code";
import { getOrisha } from "@/lib/orisha-colors";
import { SITE_URL } from "@/lib/site";

// Keyed by face id — the ring's left/front/right, the coin's reverso.
export type RingDesign = Record<string, PlacedItem[]>;

/** What kind of piece is being designed. Drives the wording and the mockup
 *  layout; everything else (variants, cart, WhatsApp) is identical. */
export type ConfiguratorPiece = "anillo" | "moneda";

export interface ConfiguratorVariant {
  id: string;
  title: string;
  amount: string;
  currencyCode: string;
  /** Shopify's availableForSale. Absent = treated as available (the pages that
   *  build this panel don't read stock yet; the price guard still applies). */
  availableForSale?: boolean;
}
export interface ConfiguratorProduct {
  handle: string;
  title: string;
  image: string;
  optionName?: string;
  /** Shopify tags — a made-to-order tag routes the panel to WhatsApp. */
  tags?: string[];
  variants: ConfiguratorVariant[];
}

// Default faces = the ring's three. A configurator for another piece (the coin)
// passes its own list, so this panel never needs to know the shapes involved.
const RING_FACE_ORDER: { id: string; label: string }[] = [
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
  orisha,
  onReset,
  piece = "anillo",
  faceOrder = RING_FACE_ORDER,
}: {
  design: RingDesign;
  product?: ConfiguratorProduct;
  orisha?: string;
  onReset: () => void;
  piece?: ConfiguratorPiece;
  faceOrder?: { id: string; label: string }[];
}) {
  const santo = orisha ? getOrisha(orisha) : undefined;
  const { addLine, setCartOpen } = useCart();
  const [variantId, setVariantId] = useState(product?.variants[0]?.id ?? "");
  const [added, setAdded] = useState(false);

  const faces = faceOrder.map((f) => ({
    ...f,
    names: (design[f.id] ?? [])
      .map((it) => getPlaceable(it.ref)?.name)
      .filter((n): n is string => Boolean(n)),
  }));
  const total = faces.reduce((n, f) => n + f.names.length, 0);
  const ready = total > 0;

  const chosen =
    product?.variants.find((v) => v.id === variantId) ?? product?.variants[0];

  // PURCHASE GUARD (lib/commerce.ts canBuyDirectly): a piece whose price is
  // still the $0/$1 placeholder, or that is made-to-order, can NEVER be checked
  // out online — the panel falls back to the WhatsApp consult, exactly like a
  // design with no product. Same guard as the watch creator.
  const canBuy =
    !!product &&
    !!chosen &&
    canBuyDirectly({
      tags: product.tags,
      availableForSale: chosen.availableForSale ?? true,
      price: { amount: chosen.amount, currencyCode: chosen.currencyCode },
    });

  function addToCart() {
    if (!product || !chosen || !ready || !canBuy) return;
    const metal =
      chosen.title && chosen.title !== "Default Title" ? chosen.title : undefined;
    const santoLabel = santo ? `${santo.name} · ${santo.saint}` : undefined;
    // one link that carries the WHOLE design → a printable sheet (mockup + spec)
    const designUrl = `${SITE_URL}/diseno?d=${encodeDesign({
      design,
      piece,
      ring: { handle: product.handle, title: product.title, variant: metal, santo: santoLabel },
    })}`;
    const properties = [
      {
        key: "Diseño",
        value: `Diseño de Ifá — ${product.title}${metal ? ` (${metal})` : ""}`,
      },
      ...(santoLabel
        ? [{ key: "Santo / Ángel de la guarda", value: santoLabel }]
        : []),
      ...faces
        .filter((f) => f.names.length)
        .map((f) => ({ key: f.label, value: f.names.join(", ") })),
      { key: "🔗 Ver e imprimir el diseño", value: designUrl },
    ];
    // Customer-facing summary (cart + the "Grabado" order attribute): the symbols
    // per face, kept short and clean — the sheet URL rides only in `properties`.
    const summary = faces
      .filter((f) => f.names.length)
      .map((f) => `${f.label}: ${f.names.join(", ")}`)
      .join(" · ");
    const uid =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${chosen.id}-${total}-${faces[0].names.length}`;
    const preview = designToPreviewDataUrl(design, piece);

    addLine(
      {
        id: `${chosen.id}-ifa-${uid}`,
        merchandiseId: chosen.id,
        productHandle: product.handle,
        title: `${product.title} — diseño de Ifá${chosen.title && chosen.title !== "Default Title" ? ` (${chosen.title})` : ""}`,
        // main cart thumbnail = the real piece photo; the design mockup shows beside
        // it (customization.preview) so the customer sees the piece AND their design.
        image: product.image || preview || "",
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

  // With a product, the consult names the chosen option (metal / size) too —
  // that's what the guard sends here when the piece can't be paid online.
  const chosenLabel = chosen?.title && chosen.title !== "Default Title" ? ` (${chosen.title})` : "";
  const whatsappHref = whatsappRingDesignUrl(
    faces.map((f) => ({ label: f.label, items: f.names })),
    { piece, ...(product ? { productTitle: `${product.title}${chosenLabel}` } : {}) },
  );

  return (
    <aside className="pyj-cfg_order" aria-label="Resumen de tu diseño">
      {product ? (
        <div className="pyj-cfg_prod">
          <span className="pyj-cfg_prod-eyebrow">Diseñando</span>
          <h2 className="pyj-cfg_order-title">{product.title}</h2>
          {chosen && (
            <span className="pyj-cfg_prod-price">
              {canBuy
                ? formatMoney({ amount: chosen.amount, currencyCode: chosen.currencyCode })
                : CONSULT_PRICE_LABEL}
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

      {/* El medidor. Con producto, vuelve a ese anillo con la talla puesta;
          sin producto (modo libre), a la página suelta. Un anillo de Ifá
          diseñado a medida en la talla equivocada es el peor de los fallos:
          no se cambia por otro, se rehace. */}
      <a
        className="pyj-talla_ayuda"
        href={
          product
            ? `/medidor-de-anillos?anillo=${encodeURIComponent(product.handle)}`
            : "/medidor-de-anillos"
        }
      >
        ¿No sabes tu talla? Mídela con tu teléfono →
      </a>

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

      {canBuy ? (
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

      {canBuy && (
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
