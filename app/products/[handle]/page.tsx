import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ProductDetail from "@/components/product/ProductDetail";
import JsonLd from "@/components/seo/JsonLd";
import { getCategoryImage, getProductByHandle, getProducts } from "@/lib/products";
import { ORISHA_NAMES } from "@/lib/orishas";
import { SITE } from "@/lib/site";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://pedrojewelryyoruba.com";

type Params = Promise<{ handle: string }>;

/** First ~155 visible chars of the product description, for meta description. */
function metaDescription(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= 155) return clean;
  return `${clean.slice(0, 152).replace(/\s+\S*$/, "")}…`;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) return { title: "Pieza no encontrada" };

  const description = product.description
    ? metaDescription(product.description)
    : `${product.title} — pieza de joyería Yoruba hecha a mano en Miami por ${SITE.name}. Oro 10k, 14k y 18k, también por encargo.`;
  const image = product.images[0]?.url;

  return {
    title: product.title,
    description,
    alternates: { canonical: `/products/${product.handle}` },
    openGraph: {
      type: "website",
      url: `${siteUrl}/products/${product.handle}`,
      siteName: SITE.name,
      title: `${product.title} | ${SITE.name}`,
      description,
      locale: "es_US",
      ...(image && {
        images: [{ url: image, width: 800, height: 800, alt: product.title }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} | ${SITE.name}`,
      description,
      ...(image && { images: [image] }),
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  const all = await getProducts();
  const related = all.filter((p) => p.handle !== handle).slice(0, 8);

  // Breadcrumb banner = the image of the category this piece belongs to
  // (falls back to the piece's own photo).
  const category = product.tags.find((t) => !ORISHA_NAMES.includes(t));
  const bgImage = (await getCategoryImage(category)) ?? product.images[0]?.url;

  // schema.org Product + Offer — price, stock and photos for Google rich
  // results (price/availability under the listing) and AI answer engines.
  const productUrl = `${siteUrl}/products/${product.handle}`;
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.title,
    description: product.description || SITE.tagline,
    url: productUrl,
    image: product.images.map((i) => i.url),
    sku: product.handle,
    brand: { "@type": "Brand", name: SITE.name },
    ...(category && { category }),
    keywords: product.tags.join(", "),
    offers: {
      "@type": "Offer",
      url: productUrl,
      price: product.price.amount,
      priceCurrency: product.price.currencyCode || "USD",
      availability: product.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${siteUrl}/#store` },
    },
  };

  // schema.org BreadcrumbList — mirrors the visible breadcrumb.
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "Colección",
        item: `${siteUrl}/shop-left-sidebar`,
      },
      { "@type": "ListItem", position: 3, name: product.title, item: productUrl },
    ],
  };

  return (
    <>
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      <Breadcrumb
        title={product.title}
        crumbs={[{ label: "Shop", href: "/shop-left-sidebar" }, { label: product.title }]}
        bgImage={bgImage}
      />
      {/* Tab Style Left layout (gallery on the left), the store-wide product style. */}
      <ProductDetail
        product={product}
        related={related}
        galleryPosition="left"
        showSale={Boolean(product.compareAtPrice)}
      />
    </>
  );
}
