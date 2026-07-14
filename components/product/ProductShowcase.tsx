"use client";

import { useState } from "react";
import type { Product, ProductVariant } from "@/lib/types";
import type { Rating } from "@/lib/judgeme";
import { publicTags } from "@/lib/commerce";
import ProductGallery from "./ProductGallery";
import ProductBuyBox from "./ProductBuyBox";
import ReviewStars from "./ReviewStars";

// The interactive top row of the product page (gallery column + content column).
// Owns the selected variant so the two stay in sync: picking a size updates the
// price + add-to-cart (ProductBuyBox) AND jumps the gallery to that variant's
// photo (via `featuredUrl`).
export default function ProductShowcase({
  product,
  rating = null,
  galleryPosition = "left",
  showSale = false,
}: {
  product: Product;
  rating?: Rating | null;
  galleryPosition?: "left" | "right";
  showSale?: boolean;
}) {
  const [variant, setVariant] = useState<ProductVariant | undefined>(
    product.variants[0],
  );

  // Gallery on the right => flip the Bootstrap column order (mirrors the
  // template's single-product-gallery-right markup).
  const imgColClass =
    galleryPosition === "right"
      ? "col-lg-5 col-md-5 order-1 order-lg-2"
      : "col-lg-5 col-md-5";
  const contentColClass =
    galleryPosition === "right"
      ? "col-lg-7 col-md-7 order-2 order-lg-1"
      : "col-lg-7 col-md-7";

  return (
    <div className="row">
      <div className={imgColClass}>
        <ProductGallery
          images={product.images}
          title={product.title}
          featuredUrl={variant?.image}
        />
      </div>
      <div className={contentColClass}>
        <div className="sp-content">
          <div className="sp-heading">
            <h5>
              <a href="#">{product.title}</a>
            </h5>
          </div>
          <span className="reference">Referencia: {product.handle}</span>
          <ReviewStars rating={rating} />
          <ProductBuyBox
            product={product}
            showSale={showSale}
            variant={variant}
            onSelectVariant={setVariant}
          />
          <div
            style={{
              margin: "18px 0 4px",
              padding: "11px 15px",
              background: "rgba(202,162,58,0.08)",
              border: "1px solid rgba(202,162,58,0.25)",
              borderRadius: 4,
              fontSize: 13,
              color: "#a99d83",
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: "var(--pyj-gold)" }}>
              Garantía de por vida
            </strong>{" "}
            en todas nuestras piezas · Hecho a mano en Miami con devoción.
          </div>
          {publicTags(product.tags).length > 0 && (
            <div className="hiraola-tag-line">
              <h6>Etiquetas:</h6>{" "}
              {publicTags(product.tags).map((tag, i, arr) => (
                <span key={tag}>
                  <a href="#">{tag}</a>
                  {i < arr.length - 1 ? ", " : ""}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
