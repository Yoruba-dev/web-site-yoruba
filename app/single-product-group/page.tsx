import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ProductDetail from "@/components/product/ProductDetail";
import { getProducts } from "@/lib/products";

export const metadata: Metadata = { title: "Single Product Group" };

export default async function SingleProductGroupPage() {
  const products = await getProducts();
  const product = products[2];
  const related = products.slice(0, 8);

  return (
    <>
      <Breadcrumb
        title="Single Product Group"
        crumbs={[{ label: "Shop", href: "/shop-left-sidebar" }, { label: "Product" }]}
      />
      <ProductDetail product={product} related={related} />
    </>
  );
}
