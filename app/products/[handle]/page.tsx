import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ProductDetail from "@/components/product/ProductDetail";
import { getProductByHandle, getProducts } from "@/lib/products";

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

  return (
    <>
      <Breadcrumb
        title={product.title}
        crumbs={[{ label: "Shop", href: "/shop-left-sidebar" }, { label: product.title }]}
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
