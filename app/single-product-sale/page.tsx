import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ProductDetail from "@/components/product/ProductDetail";
import { getProducts } from "@/lib/products";

export const metadata: Metadata = { title: "Single Product Sale" };

export default async function SingleProductSalePage() {
  const products = await getProducts();
  const product = products[1];
  const related = products.slice(0, 8);

  return (
    <>
      <Breadcrumb
        title="Single Product Sale"
        crumbs={[{ label: "Shop", href: "/shop-left-sidebar" }, { label: "Product" }]}
      />
      <ProductDetail product={product} related={related} showSale />
    </>
  );
}
