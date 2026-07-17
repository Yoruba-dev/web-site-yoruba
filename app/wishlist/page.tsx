import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import WishlistView from "@/components/product/WishlistView";

export const metadata: Metadata = {
  title: "Favoritos",
  robots: { index: false, follow: true },
};

export default function WishlistPage() {
  return (
    <>
      <Breadcrumb title="Favoritos" crumbs={[{ label: "Favoritos" }]} />
      <WishlistView />
    </>
  );
}
