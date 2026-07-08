import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import CartView from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Carrito" };

export default function CartPage() {
  return (
    <>
      <Breadcrumb title="Carrito" crumbs={[{ label: "Carrito" }]} />
      <CartView />
    </>
  );
}
