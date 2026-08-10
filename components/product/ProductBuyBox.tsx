"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart, type CartLine } from "@/lib/cart-context";
import {
  CONSULT_LABEL,
  CONSULT_PRICE_LABEL,
  isConfigurable,
  isCoinConfigurable,
  isMadeToOrder,
  isPlaceholderPriced,
  personalizationField,
  publicTags,
  whatsappConsultUrl,
} from "@/lib/commerce";
import { formatMoney, money } from "@/lib/utils";
import { SITE } from "@/lib/site";


import CompareButton from "./CompareButton";
import WishlistButton from "./WishlistButton";
import ShareButton from "./ShareButton";
import SafeImage from "@/components/ui/SafeImage";
import type { Product, ProductVariant } from "@/lib/types";
import BuyNowButton from "./BuyNowButton";

// The reactive lower half of the product page: price, availability, variant
// selector, quantity and the add-to-cart / WhatsApp-consult controls. Split out
// as a client component so choosing a size updates the price AND adds the exact
// selected variant to the cart (its own merchandiseId + price), instead of
// always buying variants[0] at the minimum price. Purchase policy still comes
// from lib/commerce.ts (made-to-order / out-of-stock -> WhatsApp consult).
//
// The selected variant is controlled by the parent <ProductShowcase> so the
// gallery can jump to the variant's photo in sync with the price.
export default function ProductBuyBox({
  product,
  showSale = false,
  variant,
  onSelectVariant,
}: {
  product: Product;
  showSale?: boolean;
  variant?: ProductVariant;
  onSelectVariant?: (v: ProductVariant) => void;
}) {
  const { addLine, addItem } = useCart();
  const variants = product.variants;
  const hasVariants = variants.length > 1;
  const [qty, setQty] = useState(1);

  // What this piece asks the shopper to specify (colour/Orisha, animal, …).
  // Declared per tag in lib/commerce.ts so adding a kind needs no change here.
  const personal = personalizationField(product.tags);
  const needsDetail = Boolean(personal);
  const [detail, setDetail] = useState("");
  const [detailError, setDetailError] = useState(false);

  // Price shown follows the selected variant (falls back to the product's
  // "from" price for single-variant pieces).
  const price = variant?.price ?? product.price;
  const oldPrice =
    product.compareAtPrice ?? money(Number(price.amount) * 1.25, price.currencyCode);

  const madeToOrder = isMadeToOrder(product.tags);
  const inStock = variant ? variant.availableForSale : product.availableForSale;
  // A $0/$1 price is a placeholder (price not set in Shopify) → force a consult,
  // never a $0 checkout. Follows the SELECTED variant's price.
  const placeholderPrice = isPlaceholderPriced(price);
  const buyable = !madeToOrder && !placeholderPrice && inStock;

  function add() {
    const line = resolveLine();
    if (!line) return;
    if (line.merchandiseId) addLine(line, qty);
    else addItem(product, qty);
  }

  /** The one definition of "what this shopper is buying right now": selected
   *  variant, its real Shopify GID and price, the Color/Orisha choice, and the
   *  validation that goes with it. Add-to-cart and Comprar ahora both go through
   *  here so they can never disagree. Returns null when the form isn't valid. */
  function resolveLine(): Omit<CartLine, "quantity"> | null {
    const detailText = detail.trim();
    if (needsDetail && !detailText) {
      setDetailError(true);
      return null;
    }
    const chosen = variant ?? product.variants[0];
    const base =
      hasVariants && variant ? `${product.title} — ${variant.title}` : product.title;
    const title = needsDetail && detailText ? `${base} · ${detailText}` : base;
    const properties =
      needsDetail && detailText
        ? [{ key: personal!.label, value: detailText }]
        : undefined;

    if (!chosen) {
      // No real variant to point Shopify at — fall back to the plain product line.
      return {
        id: product.id,
        productHandle: product.handle,
        title,
        image: product.images[0]?.url ?? "",
        price: Number(price.amount),
        currencyCode: price.currencyCode,
      };
    }
    // Build the line around the SELECTED variant so checkout uses its real
    // Shopify GID (merchandiseId) and its own price. A colour choice gets a
    // synthetic id so different colours stay as separate cart lines.
    return {
      id: needsDetail && detailText ? `${chosen.id}-${detailText}` : chosen.id,
      merchandiseId: chosen.id,
      productHandle: product.handle,
      title,
      image: product.images[0]?.url ?? "",
      price: Number(price.amount),
      currencyCode: price.currencyCode,
      properties,
    };
  }

  return (
    <>
      <div className="price-box">
        {placeholderPrice ? (
          <span className="new-price pyj-price-consult">{CONSULT_PRICE_LABEL}</span>
        ) : (
          <>
            <span className="new-price">{formatMoney(price)}</span>
            {(showSale || product.compareAtPrice) && (
              <span className="old-price">{formatMoney(oldPrice)}</span>
            )}
          </>
        )}
      </div>

      {/* A coin is engraved and a ring is built, so each opens its own editor.
          Coin wins when a piece somehow matches both. */}
      {isCoinConfigurable(product) ? (
        <Link
          href={`/configurador-monedas?moneda=${encodeURIComponent(product.handle)}`}
          className="pyj-design-cta"
        >
          ✦ Diseña esta moneda con tu signo de Ifá →
        </Link>
      ) : (
        isConfigurable(product) && (
          <Link
            href={`/configurador?anillo=${encodeURIComponent(product.handle)}`}
            className="pyj-design-cta"
          >
            ✦ Diseña este anillo con tus signos de Ifá →
          </Link>
        )
      )}

      <div className="sp-essential_stuff">
        <ul>
          <li>
            Marca: <a href="#">{SITE.name}</a>
          </li>
          {/* El tipo de producto de Shopify ("Idde", "Dijes y Medallas"…) es la
              categoría de verdad. La primera etiqueta solo vale de respaldo para
              las fichas antiguas: en la taxonomía nueva las etiquetas son
              facetas ordenadas alfabéticamente, así que salían cosas como
              "Categoría: greca" o "Categoría: mujer". */}
          {(product.productType || publicTags(product.tags)[0]) && (
            <li>
              Categoría:{" "}
              <a href="#">{product.productType || publicTags(product.tags)[0]}</a>
            </li>
          )}
          <li>
            Código: <a href="#">{product.handle}</a>
          </li>
          <li>
            Disponibilidad: <a href="#">{inStock ? "En stock" : "Agotado"}</a>
          </li>
        </ul>
      </div>

      {hasVariants && (
        <div className="pyj-variant-select">
          <label className="pyj-variant-label">
            {product.optionName ?? "Opción"}
            {variant && (
              <span className="pyj-variant-chosen">{variant.title}</span>
            )}
          </label>
          <div className="pyj-variant-options" role="radiogroup">
            {variants.map((v) => {
              const selected = v.id === variant?.id;
              const soldOut = !v.availableForSale;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  className={`pyj-variant-btn${selected ? " is-selected" : ""}${
                    soldOut ? " is-soldout" : ""
                  }`}
                  onClick={() => onSelectVariant?.(v)}
                  aria-checked={selected}
                >
                  {v.image && (
                    <SafeImage
                      className="pyj-variant-thumb"
                      src={v.image}
                      width={160}
                      alt={v.title}
                    />
                  )}
                  <span className="pyj-variant-info">
                    <span className="pyj-variant-name">{v.title}</span>
                    <span className="pyj-variant-price">
                      {isPlaceholderPriced(v.price)
                        ? "A consultar"
                        : formatMoney(v.price)}
                      {soldOut && " · Agotado"}
                    </span>
                  </span>
                  <span className="pyj-variant-check" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {needsDetail && buyable && (
        <div className="pyj-color-select_wrap">
          <label className="pyj-variant-label" htmlFor="pyj-color-input">
            {personal!.label}
          </label>
          <input
            id="pyj-color-input"
            type="text"
            className="pyj-color-select"
            value={detail}
            onChange={(e) => {
              setDetail(e.target.value);
              setDetailError(false);
            }}
            placeholder={personal!.placeholder}
            aria-invalid={detailError}
            maxLength={120}
          />
          <p className="pyj-color-hint">{personal!.hint}</p>
          {detailError && (
            <p className="pyj-color-error">{personal!.error}</p>
          )}
        </div>
      )}

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
          {placeholderPrice
            ? "El precio de esta pieza se cotiza a pedido. Escríbenos por WhatsApp y te confirmamos el precio y los detalles antes de tu pedido."
            : madeToOrder
              ? "Esta pieza se hace por encargo. Escríbenos por WhatsApp para confirmar medidas, quilate y detalles antes de tu pedido."
              : "Pieza agotada por ahora. Escríbenos por WhatsApp y te avisamos o la hacemos por encargo."}
        </p>
      )}

      {/* Pay without a detour through the cart — for the shopper who already
          decided. Sits ABOVE "Añadir al carrito" because it is the shorter path;
          it hides itself for made-to-order/out-of-stock pieces, where the only
          honest next step is the WhatsApp consult below. */}
      {buyable && (
        <div className="pyj-buynow_area">
          <BuyNowButton buildLine={() => {
            const line = resolveLine();
            return line ? { ...line, quantity: qty } : null;
          }} />
          <span className="pyj-buynow_hint">
            Vas directo al pago seguro de Shopify. El carrito se queda como está.
          </span>
        </div>
      )}

      <div className="qty-btn_area">
        <ul>
          <li>
            {buyable ? (
              <a className="qty-cart_btn" style={{ cursor: "pointer" }} onClick={add}>
                Añadir al carrito
              </a>
            ) : (
              <a
                className="qty-cart_btn"
                href={whatsappConsultUrl(product, variant, { detail: detail.trim() || undefined, detailLabel: personal?.label })}
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
          <li>
            <ShareButton
              className="qty-share_btn"
              handle={product.handle}
              title={product.title}
            />
          </li>
        </ul>
      </div>

      {/* Custom-order note: this workshop makes pieces in other karats / sizes to
          order — the 14k upgrade is handled by WhatsApp consultation. */}
      <a
        className="pyj-custom-note"
        href={whatsappConsultUrl(product, variant, {
          karat: true,
          detail: detail.trim() || undefined,
          detailLabel: personal?.label,
        })}
        target="_blank"
        rel="noreferrer"
      >
        <i className="fa fa-whatsapp" aria-hidden="true" />
        <span>
          ¿La quieres en <strong>14k · 18k</strong> o a tu medida? Se hace por
          encargo — escríbenos por <strong>WhatsApp</strong>.
        </span>
      </a>
    </>
  );
}
