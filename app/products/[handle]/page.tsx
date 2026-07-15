import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ProductDetail from "@/components/product/ProductDetail";
import JsonLd from "@/components/seo/JsonLd";
import { getCategoryImage, getProductByHandle, getProducts } from "@/lib/products";
import { getProductRating } from "@/lib/judgeme";
import { attachRatings } from "@/lib/product-ratings";
import { RETURN_POLICY_SCHEMA } from "@/lib/merchant-policy";
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

  // Truly related products: rank the catalogue by how many tags (category +
  // Orisha) each piece shares with this one, most-shared first. If there aren't
  // enough real matches, pad with other pieces so the slider is never empty.
  const all = await getProducts(250);
  const others = all.filter((p) => p.handle !== handle);
  const shared = (p: (typeof others)[number]) =>
    p.tags.filter((t) => product.tags.includes(t)).length;
  const matched = others
    .filter((p) => shared(p) > 0)
    .sort((a, b) => shared(b) - shared(a));
  const related = await attachRatings(
    [...matched, ...others.filter((p) => !matched.includes(p))].slice(0, 8),
  );

  // Real review rating from Judge.me (null when the piece has no reviews yet).
  const rating = await getProductRating(product.handle);

  // Breadcrumb banner = the image of the category this piece belongs to
  // (falls back to the piece's own photo).
  const category = product.tags.find((t) => !ORISHA_NAMES.includes(t));
  const bgImage = (await getCategoryImage(category)) ?? product.images[0]?.url;

  // schema.org Product + Offer — price, stock and photos for Google rich
  // results (price/availability under the listing) and AI answer engines.
  const productUrl = `${siteUrl}/products/${product.handle}`;
  // Google rejects skus with emoji/exotic characters (some handles have them,
  // e.g. "corona-👑10k") — use the numeric Shopify product id: short, stable,
  // ASCII. Falls back to a sanitized handle for non-Shopify (mock) data.
  const sku =
    product.id.match(/(\d+)$/)?.[1] ??
    product.handle.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.title,
    description: product.description || SITE.tagline,
    url: productUrl,
    image: product.images.map((i) => i.url),
    sku,
    brand: { "@type": "Brand", name: SITE.name },
    ...(category && { category }),
    keywords: product.tags.join(", "),
    // Real Judge.me reviews → stars in rich results + trust signal for AI
    // answer engines. Only emitted when the piece actually has reviews.
    ...(rating &&
      rating.count > 0 && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: rating.rating,
          reviewCount: rating.count,
          bestRating: 5,
          worstRating: 1,
        },
      }),
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
      hasMerchantReturnPolicy: RETURN_POLICY_SCHEMA,
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
        rating={rating}
        galleryPosition="left"
        showSale={Boolean(product.compareAtPrice)}
      />
    </>
  );
}
