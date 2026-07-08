import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import CheckoutView from "@/components/checkout/CheckoutView";

export const metadata: Metadata = { title: "Finalizar compra" };

export default function CheckoutPage() {
  return (
    <>
      <Breadcrumb title="Finalizar compra" crumbs={[{ label: "Finalizar compra" }]} />
      <CheckoutView />
    </>
  );
}
