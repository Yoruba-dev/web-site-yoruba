import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ShopContent from "@/components/shop/ShopContent";

export const metadata: Metadata = { title: "Shop Right Sidebar" };

export default function ShopRightSidebarPage() {
  return (
    <>
      <Breadcrumb title="Shop" crumbs={[{ label: "Shop Right Sidebar" }]} />
      <ShopContent sidebar="right" view="grid" columns={3} />
    </>
  );
}
