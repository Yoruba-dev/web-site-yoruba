import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ProductDetail from "@/components/product/ProductDetail";
import { getProducts } from "@/lib/products";

export const metadata: Metadata = { title: "Single Product Tab Style Right" };

export default async function SingleProductTabStyleRightPage() {
  const products = await getProducts();
  const product = products[9];
  const related = products.slice(0, 8);

  return (
    <>
      <Breadcrumb
        title="Single Product Tab Style Right"
        crumbs={[{ label: "Shop", href: "/shop-left-sidebar" }, { label: "Product" }]}
      />
      <ProductDetail
        product={product}
        related={related}
        galleryPosition="right"
      />
    </>
  );
}
