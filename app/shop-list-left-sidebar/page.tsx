import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ShopContent from "@/components/shop/ShopContent";

export const metadata: Metadata = { title: "Shop List Left Sidebar" };

export default function ShopListLeftSidebarPage() {
  return (
    <>
      <Breadcrumb title="Shop" crumbs={[{ label: "Shop List Left Sidebar" }]} />
      <ShopContent sidebar="left" view="list" />
    </>
  );
}
