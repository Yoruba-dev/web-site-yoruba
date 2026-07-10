import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ProductDetail from "@/components/product/ProductDetail";
import { getCategoryImage, getProductByHandle, getProducts } from "@/lib/products";
import { ORISHA_NAMES } from "@/lib/orishas";

type Params = Promise<{ handle: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  return { title: product?.title ?? "Product" };
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

  return (
    <>
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
