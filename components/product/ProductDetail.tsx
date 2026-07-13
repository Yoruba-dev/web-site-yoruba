import type { Product } from "@/lib/types";
import ProductShowcase from "@/components/product/ProductShowcase";
import ProductTabsDetail from "@/components/product/ProductTabsDetail";
import ProductSlider from "@/components/product/ProductSlider";

// Faithful port of the template's single-product layout (`.sp-area` / `.sp-nav`):
// image gallery column + `.sp-content` column, followed by the description /
// reviews tabs and a "Related Products" slider. The cart-wired quantity + add
// group lives in the embedded client <ProductBuyBox>.
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
  return (
    <>
      {/* Begin Hiraola's Single Product Area */}
      <div className="sp-area">
        <div className="container">
          <div className="sp-nav">
            <ProductShowcase
              product={product}
              galleryPosition={galleryPosition}
              showSale={showSale}
            />
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
