import Link from "next/link";
import ProductSlider from "@/components/product/ProductSlider";
import type { Product } from "@/lib/types";

// A homepage category row: title + "Ver todo" link on the same line, then a
// 5-up product slider of that category. Reuses the site's section-title styling.
export default function CategorySection({
  title,
  products,
  href,
}: {
  title: string;
  products: Product[];
  href: string;
}) {
  if (products.length === 0) return null;
  return (
    <div className="hiraola-product_area">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div
              className="hiraola-section_title"
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <h4 style={{ margin: 0 }}>{title}</h4>
              <Link
                href={href}
                style={{
                  color: "var(--pyj-gold)",
                  fontSize: 14,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                Ver todo →
              </Link>
            </div>
          </div>
          <div className="col-lg-12">
            <ProductSlider products={products} />
          </div>
        </div>
      </div>
    </div>
  );
}
