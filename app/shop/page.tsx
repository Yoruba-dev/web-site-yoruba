import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ShopContent from "@/components/shop/ShopContent";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shop",
  // Simpler duplicate of /shop-left-sidebar; keep it out of the index.
  robots: { index: false, follow: true },
};

export default function ShopPage() {
  return (
    <>
      <Breadcrumb
        title="Jewellery"
        crumbs={[{ label: "Shop" }]}
        bgImage={SITE.heroSlides[1].image}
      />
      <ShopContent view="grid" columns={3} />
    </>
  );
}
