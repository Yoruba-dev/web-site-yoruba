import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ProductCard from "@/components/product/ProductCard";
import ArticleBody from "@/components/blog/ArticleBody";
import JsonLd from "@/components/seo/JsonLd";
import { getCollectionProducts, getCollections } from "@/lib/products";
import { attachRatings } from "@/lib/product-ratings";
import { getCollectionContent } from "@/lib/collection-content";
import {
  breadcrumbSchema,
  collectionPageSchema,
  itemListSchema,
  faqPageSchema,
} from "@/lib/schema";
import { sizedImageUrl } from "@/lib/utils";
import { OG_IMAGE } from "@/lib/site";

// Live from Shopify; refresh hourly (a product webhook can also revalidate).
export const revalidate = 3600;

type Params = Promise<{ handle: string }>;

// Pre-render every collection known at build time (there are only ~12) —
// same SEO/perf pattern as app/blog/[slug]/page.tsx. A brand-new collection
// not yet in this list still renders on-demand (dynamicParams stays true).
export async function generateStaticParams() {
  const cols = await getCollections();
  return cols.map((c) => ({ handle: c.handle }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { handle } = await params;
  const col = await getCollectionProducts(handle);
  if (!col) return { title: "Colección" };
  const content = getCollectionContent(handle);
  const title = content?.seoTitle ?? `${col.title} — Colección`;
  const description =
    content?.metaDescription ||
    col.description ||
    `${col.title}: joyería Yoruba hecha a mano en Miami — oro 10k, 14k y plata, piezas por encargo para los Orishas.`;
  return {
    title,
    description,
    alternates: { canonical: `/collections/${handle}` },
    openGraph: {
      type: "website",
      // The collection's first product photo makes a better share thumbnail;
      // fall back to the branded default so there's never a blank preview.
      images: col.products[0]?.images[0]?.url
        ? [{ url: sizedImageUrl(col.products[0].images[0].url, 1200) }]
        : OG_IMAGE,
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
  const products = await attachRatings(col.products);
  const content = getCollectionContent(handle);

  const description =
    content?.metaDescription ||
    col.description ||
    `${col.title}: joyería Yoruba hecha a mano en Miami — oro 10k, 14k y plata, piezas por encargo para los Orishas.`;

  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Colecciones" },
    { name: col.title },
  ]);
  const collectionPageLd = collectionPageSchema({
    handle,
    name: col.title,
    description,
  });
  const itemListLd = itemListSchema({
    handle,
    items: products.slice(0, 24).map((p) => ({
      handle: p.handle,
      title: p.title,
      image: p.images[0]?.url ? sizedImageUrl(p.images[0].url, 400) : undefined,
    })),
  });
  const faqLd = content?.faqs ? faqPageSchema(content.faqs) : null;

  return (
    <>
      <Breadcrumb
        title={col.title}
        crumbs={[{ label: "Colecciones" }, { label: col.title }]}
        bgImage={col.products[0]?.images[0]?.url}
      />
      <JsonLd data={breadcrumbLd} />
      <JsonLd data={collectionPageLd} />
      <JsonLd data={itemListLd} />
      {faqLd && <JsonLd data={faqLd} />}

      <div className="hiraola-product_area" style={{ paddingTop: 30 }}>
        <div className="container">
          {/* The <h1> for this page is the Breadcrumb title (col.title) above. */}
          {content?.intro && (
            <div style={{ maxWidth: 720, marginBottom: 18 }}>
              <ArticleBody blocks={content.intro} />
            </div>
          )}

          {col.description && (
            <p
              className="short_desc"
              style={{ maxWidth: 720, marginBottom: 26, color: "var(--dk-text)" }}
            >
              {col.description}
            </p>
          )}

          {products.length === 0 ? (
            <p style={{ color: "var(--dk-text)" }}>
              Pronto habrá piezas en esta categoría.
            </p>
          ) : (
            <div className="shop-product-wrap grid row">
              {products.map((product) => (
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

      {content?.faqs && (
        <section className="pyj-may_intro">
          <div className="container">
            <h2>Preguntas frecuentes sobre {col.title.toLowerCase()}</h2>
            {content.faqs.map((f) => (
              <div className="pyj-guide_qa" key={f.q}>
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
