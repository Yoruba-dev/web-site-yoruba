import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ShopContent from "@/components/shop/ShopContent";

export const metadata: Metadata = { title: "Shop Left Sidebar" };

export default function ShopLeftSidebarPage() {
  return (
    <>
      <Breadcrumb title="Shop" crumbs={[{ label: "Shop Left Sidebar" }]} />
      <ShopContent sidebar="left" view="grid" columns={3} />
    </>
  );
}
