import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ShopContent from "@/components/shop/ShopContent";

export const metadata: Metadata = { title: "Shop List Fullwidth" };

export default function ShopListFullwidthPage() {
  return (
    <>
      <Breadcrumb title="Shop" crumbs={[{ label: "Shop List Fullwidth" }]} />
      <ShopContent view="list" />
    </>
  );
}
