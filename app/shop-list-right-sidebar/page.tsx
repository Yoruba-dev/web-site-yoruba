import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ShopContent from "@/components/shop/ShopContent";

export const metadata: Metadata = { title: "Shop List Right Sidebar" };

export default function ShopListRightSidebarPage() {
  return (
    <>
      <Breadcrumb title="Shop" crumbs={[{ label: "Shop List Right Sidebar" }]} />
      <ShopContent sidebar="right" view="list" />
    </>
  );
}
