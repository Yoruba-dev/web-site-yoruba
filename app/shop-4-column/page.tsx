import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ShopContent from "@/components/shop/ShopContent";

export const metadata: Metadata = { title: "Shop Column Four" };

export default function ShopFourColumnPage() {
  return (
    <>
      <Breadcrumb title="Shop" crumbs={[{ label: "Shop Column Four" }]} />
      <ShopContent view="grid" columns={4} />
    </>
  );
}
