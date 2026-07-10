import type { Product } from "@/lib/types";
import { SITE } from "@/lib/site";
import { formatMoney, money } from "@/lib/utils";
import RatingStars from "@/components/ui/RatingStars";
import ProductPurchase from "@/components/product/ProductPurchase";
import ProductShare from "@/components/product/ProductShare";
import ProductGallery from "@/components/product/ProductGallery";
import ProductTabsDetail from "@/components/product/ProductTabsDetail";
import ProductSlider from "@/components/product/ProductSlider";

// Faithful port of the template's single-product layout (`.sp-area` / `.sp-nav`):
// image gallery column + `.sp-content` column, followed by the description /
// reviews tabs and a "Related Products" slider. The cart-wired quantity + add
// group lives in the embedded client <ProductPurchase>.
export default function ProductDetail({
  product,
  related,
  galleryPosition = "left",
  showSale = false,
}: {
  product: Product;
  related: Product[];
  galleryPosition?: "left" | "right";
  showSale?: boolean;
}) {
  // When the product is on sale, prefer its real compareAtPrice; otherwise fall
  // back to a demo old price so the sale layout is visible.
  const oldPrice =
    product.compareAtPrice ??
    money(Number(product.price.amount) * 1.25, product.price.currencyCode);

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
    <>
      {/* Begin Hiraola's Single Product Area */}
      <div className="sp-area">
        <div className="container">
          <div className="sp-nav">
            <div className="row">
              <div className={imgColClass}>
                <ProductGallery images={product.images} title={product.title} />
              </div>
              <div className={contentColClass}>
                <div className="sp-content">
                  <div className="sp-heading">
                    <h5>
                      <a href="#">{product.title}</a>
                    </h5>
                  </div>
                  <span className="reference">Referencia: {product.handle}</span>
                  <RatingStars rating={product.rating} />
                  {showSale ? (
                    <div className="price-box">
                      <span className="new-price">
                        {formatMoney(product.price)}
                      </span>
                      <span className="old-price">{formatMoney(oldPrice)}</span>
                    </div>
                  ) : (
                    <div className="price-box">
                      <span className="new-price">
                        {formatMoney(product.price)}
                      </span>
                      {product.compareAtPrice && (
                        <span className="old-price">
                          {formatMoney(product.compareAtPrice)}
                        </span>
                      )}
                    </div>
                  )}
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
                        Disponibilidad:{" "}
                        <a href="#">
                          {product.availableForSale ? "En stock" : "Agotado"}
                        </a>
                      </li>
                    </ul>
                  </div>
                  <ProductPurchase product={product} />
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
                    🛡️{" "}
                    <strong style={{ color: "var(--pyj-gold)" }}>
                      Garantía de por vida
                    </strong>{" "}
                    en todas nuestras piezas · Hecho a mano en Miami con devoción.
                  </div>
                  {product.tags.length > 0 && (
                    <div className="hiraola-tag-line">
                      <h6>Etiquetas:</h6>{" "}
                      {product.tags.map((tag, i) => (
                        <span key={tag}>
                          <a href="#">{tag}</a>
                          {i < product.tags.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                  )}
                  <ProductShare product={product} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Hiraola's Single Product Area End Here */}

      {/* Begin Hiraola's Single Product Tab Area */}
      <ProductTabsDetail product={product} />
      {/* Hiraola's Single Product Tab Area End Here */}

      {/* Begin Hiraola's Related Products Area */}
      <div className="hiraola-product_area hiraola-product_area-2 ">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="hiraola-section_title">
                <h4>Productos Relacionados</h4>
              </div>
            </div>
            <div className="col-lg-12">
              <ProductSlider
                products={related}
                className="hiraola-product-tab_slider-2"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Hiraola's Related Products Area End Here */}
    </>
  );
}
