"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { CONSULT_LABEL, isMadeToOrder, whatsappConsultUrl } from "@/lib/commerce";
import { formatMoney, money } from "@/lib/utils";
import { SITE } from "@/lib/site";
import CompareButton from "./CompareButton";
import WishlistButton from "./WishlistButton";
import type { Product, ProductVariant } from "@/lib/types";

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

  // Price shown follows the selected variant (falls back to the product's
  // "from" price for single-variant pieces).
  const price = variant?.price ?? product.price;
  const oldPrice =
    product.compareAtPrice ?? money(Number(price.amount) * 1.25, price.currencyCode);

  const madeToOrder = isMadeToOrder(product.tags);
  const inStock = variant ? variant.availableForSale : product.availableForSale;
  const buyable = !madeToOrder && inStock;

  function add() {
    if (variant) {
      // Build the cart line around the SELECTED variant so checkout uses its
      // real Shopify GID (merchandiseId) and its own price.
      addLine(
        {
          id: variant.id,
          merchandiseId: variant.id,
          productHandle: product.handle,
          title: hasVariants ? `${product.title} — ${variant.title}` : product.title,
          image: product.images[0]?.url ?? "",
          price: Number(price.amount),
          currencyCode: price.currencyCode,
        },
        qty,
      );
    } else {
      addItem(product, qty);
    }
  }

  return (
    <>
      <div className="price-box">
        <span className="new-price">{formatMoney(price)}</span>
        {(showSale || product.compareAtPrice) && (
          <span className="old-price">{formatMoney(oldPrice)}</span>
        )}
      </div>

      <div className="sp-essential_stuff">
        <ul>
          <li>
            Marca: <a href="#">{SITE.name}</a>
          </li>
          {product.tags.length > 0 && (
            <li>
              Categoría: <a href="#">{product.tags[0]}</a>
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
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="pyj-variant-thumb" src={v.image} alt={v.title} />
                  )}
                  <span className="pyj-variant-info">
                    <span className="pyj-variant-name">{v.title}</span>
                    <span className="pyj-variant-price">
                      {formatMoney(v.price)}
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
          {madeToOrder
            ? "Esta pieza se hace por encargo. Escríbenos por WhatsApp para confirmar medidas, quilate y detalles antes de tu pedido."
            : "Pieza agotada por ahora. Escríbenos por WhatsApp y te avisamos o la hacemos por encargo."}
        </p>
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

      {/* Custom-order note: this workshop makes pieces in other karats / sizes to
          order — the 14k upgrade is handled by WhatsApp consultation. */}
      <a
        className="pyj-custom-note"
        href={whatsappConsultUrl(product)}
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
