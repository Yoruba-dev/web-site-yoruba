import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ShopContent from "@/components/shop/ShopContent";

export const metadata: Metadata = { title: "Shop Grid Fullwidth" };

export default function ShopThreeColumnPage() {
  return (
    <>
      <Breadcrumb title="Shop" crumbs={[{ label: "Shop Column Three" }]} />
      <ShopContent view="grid" columns={3} />
    </>
  );
}
