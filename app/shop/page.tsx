import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ShopContent from "@/components/shop/ShopContent";

export const metadata: Metadata = { title: "Shop" };

export default function ShopPage() {
  return (
    <>
      <Breadcrumb title="Jewellery" crumbs={[{ label: "Shop" }]} />
      <ShopContent view="grid" columns={3} />
    </>
  );
}
