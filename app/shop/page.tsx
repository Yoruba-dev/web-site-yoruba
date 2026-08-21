import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ShopContent from "@/components/shop/ShopContent";
import { BREADCRUMB_IMAGE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tienda",
  // Duplicado simple de /shop-left-sidebar: fuera del índice. El canonical
  // apunta a la tienda buena — sin él heredaba el de la portada, que le decía
  // a Google que esta página ES la home.
  robots: { index: false, follow: true },
  alternates: { canonical: "/shop-left-sidebar" },
};

export default function ShopPage() {
  return (
    <>
      <Breadcrumb
        title="Tienda"
        crumbs={[{ label: "Tienda" }]}
        bgImage={BREADCRUMB_IMAGE}
      />
      <ShopContent columns={3} />
    </>
  );
}
