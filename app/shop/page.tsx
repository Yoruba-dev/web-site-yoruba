import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ShopContent from "@/components/shop/ShopContent";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Shop" };

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
