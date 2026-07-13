import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ShopContent from "@/components/shop/ShopContent";
import { getCategoryImage } from "@/lib/products";

type SearchParams = Promise<{ cat?: string }>;

// The real shop page — title/description follow the browsed category so each
// category URL (?cat=…) presents itself as its own landing page.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { cat } = await searchParams;
  const title = cat ? `${cat} — Colección` : "Colección de Joyería Yoruba";
  const description = cat
    ? `${cat}: joyería Yoruba hecha a mano en Miami — oro 10k, 14k y 18k, piezas por encargo para los Orishas.`
    : "Catálogo completo de joyería Yoruba: Idde, elekes, herramientas de santo, anillos y esclavas en oro 10k, 14k y 18k. Hecho a mano en Miami, por encargo.";
  return {
    title,
    description,
    alternates: { canonical: "/shop-left-sidebar" },
  };
}

export default async function ShopLeftSidebarPage({
  searchParams,
}: {
  searchParams: SearchParams;
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
