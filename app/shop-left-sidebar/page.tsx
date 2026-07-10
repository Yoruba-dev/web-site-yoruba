import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ShopContent from "@/components/shop/ShopContent";
import { getCategoryImage } from "@/lib/products";

export const metadata: Metadata = { title: "Shop Left Sidebar" };

export default async function ShopLeftSidebarPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  // When browsing a category, title + banner reflect that category.
  const bgImage = await getCategoryImage(cat);
  return (
    <>
      <Breadcrumb
        title={cat ?? "Shop"}
        crumbs={[{ label: cat ?? "Shop Left Sidebar" }]}
        bgImage={bgImage}
      />
      <ShopContent sidebar="left" view="grid" columns={3} />
    </>
  );
}
