import SectionTitle from "@/components/ui/SectionTitle";
import ProductSlider from "@/components/product/ProductSlider";
import type { Product } from "@/lib/types";

// Fila de categoría de la portada: cabecera con "Ver todo" y, debajo, el
// carrusel de piezas. La cabecera la pone SectionTitle — antes iba escrita a
// mano aquí, y al envolver el <h4> en un <div> se perdía la raya dorada de la
// plantilla (`.hiraola-section_title > h4:before` pide hijo directo).
export default function CategorySection({
  title,
  products,
  href,
  subtitle,
}: {
  title: string;
  products: Product[];
  href: string;
  subtitle?: string;
}) {
  if (products.length === 0) return null;
  return (
    <div className="hiraola-product_area">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <SectionTitle
              title={title}
              subtitle={subtitle}
              action={{ label: "Ver todo", href }}
            />
          </div>
          <div className="col-lg-12">
            <ProductSlider products={products} />
          </div>
        </div>
      </div>
    </div>
  );
}
