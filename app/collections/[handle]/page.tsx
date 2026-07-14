import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ProductCard from "@/components/product/ProductCard";
import { getCollectionProducts } from "@/lib/products";

// Live from Shopify; refresh hourly (a product webhook can also revalidate).
export const revalidate = 3600;

type Params = Promise<{ handle: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { handle } = await params;
  const col = await getCollectionProducts(handle);
  if (!col) return { title: "Colección" };
  const description =
    col.description ||
    `${col.title}: joyería Yoruba hecha a mano en Miami — oro 10k, 14k y plata, piezas por encargo para los Orishas.`;
  return {
    title: `${col.title} — Colección`,
    description,
    alternates: { canonical: `/collections/${handle}` },
    openGraph: {
      type: "website",
      title: `${col.title} — Pedro Yoruba Jewelry`,
      description,
      url: `/collections/${handle}`,
      locale: "es_US",
    },
  };
}

export default async function CollectionPage({ params }: { params: Params }) {
  const { handle } = await params;
  const col = await getCollectionProducts(handle);
  if (!col) notFound();

  return (
    <>
      <Breadcrumb
        title={col.title}
        crumbs={[{ label: "Colecciones" }, { label: col.title }]}
        bgImage={col.products[0]?.images[0]?.url}
      />

      <div className="hiraola-product_area" style={{ paddingTop: 30 }}>
        <div className="container">
          {col.description && (
            <p
              className="short_desc"
              style={{ maxWidth: 720, marginBottom: 26, color: "var(--dk-text)" }}
            >
              {col.description}
            </p>
          )}

          {col.products.length === 0 ? (
            <p style={{ color: "var(--dk-text)" }}>
              Pronto habrá piezas en esta categoría.
            </p>
          ) : (
            <div className="shop-product-wrap grid row">
              {col.products.map((product) => (
                <div className="col-6 col-lg-4" key={product.id}>
                  <div className="slide-item">
                    <ProductCard product={product} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
