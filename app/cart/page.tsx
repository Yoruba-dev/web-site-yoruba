import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import CartView from "@/components/cart/CartView";
import { getPromo } from "@/lib/promo";

export const metadata: Metadata = { title: "Carrito" };

export default async function CartPage() {
  const promo = await getPromo();
  return (
    <>
      <Breadcrumb title="Carrito" crumbs={[{ label: "Carrito" }]} />
      <CartView promo={promo} />
    </>
  );
}
