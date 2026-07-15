import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ShopContent from "@/components/shop/ShopContent";
import { SITE } from "@/lib/site";

// STATIC route (revalidates hourly). We deliberately DON'T read `searchParams`
// here — reading it forced every request to render dynamically (152 cards +
// rating lookups), which made this page slow. Category deep-links still work:
// `?cat=…` is read CLIENT-SIDE in ShopBrowser to pre-select the filter, and all
// ?cat variants canonical to this URL, so per-category metadata added no SEO
// value anyway.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Colección de Joyería Yoruba",
  description:
    "Catálogo completo de joyería Yoruba: Idde, elekes, herramientas de santo, anillos y esclavas en oro 10k, 14k y 18k. Hecho a mano en Miami, por encargo.",
  alternates: { canonical: "/shop-left-sidebar" },
};

export default function ShopLeftSidebarPage() {
  return (
    <>
      {/* Static banner: the no-copy collage from the Shopify slideshow — a real
          jewellery photo behind the SHOP title (the page is static, so no per-
          category image here; the category shows as a filter chip instead). */}
      <Breadcrumb
        title="Shop"
        crumbs={[{ label: "Colección" }]}
        bgImage={SITE.heroSlides[1].image}
      />
      <ShopContent sidebar="left" view="grid" columns={3} />
    </>
  );
}
