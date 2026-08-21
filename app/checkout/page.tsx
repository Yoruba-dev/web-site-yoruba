import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import CheckoutView from "@/components/checkout/CheckoutView";
import { getPromo } from "@/lib/promo";

export const metadata: Metadata = { title: "Finalizar compra" };

export default async function CheckoutPage() {
  const promo = await getPromo();
  return (
    <>
      <Breadcrumb title="Finalizar compra" crumbs={[{ label: "Finalizar compra" }]} />
      <CheckoutView promo={promo} />
    </>
  );
}
