import { getCollectionCounts, getCollections, getProducts } from "@/lib/products";
import { attachRatings } from "@/lib/product-ratings";
import CategoryRail from "./CategoryRail";
import ShopBrowser from "./ShopBrowser";

// Server wrapper: fetches the catalogue, then hands it to the client-side
// ShopBrowser which renders the (functional) filters + grid/list. One component
// drives all 7 shop routes via props.
export interface ShopContentProps {
  sidebar?: "left" | "right";
  columns?: 3 | 4;
}

export default async function ShopContent(props: ShopContentProps) {
  // Show the full catalogue on the shop pages (the filters/sort narrow it down).
  // The category rail goes ABOVE it: landing on 160 mixed pieces with only tag
  // filters to hand makes the shopper do the sorting we already did in Shopify.
  const [products, collections, counts] = await Promise.all([
    attachRatings(await getProducts(500)),
    getCollections(),
    getCollectionCounts(),
  ]);
  return (
    <>
      <CategoryRail
        title="Compra por categoría"
        items={collections.map((c) => ({
          href: `/collections/${c.handle}`,
          label: c.title,
          image: c.image,
          count: counts[c.handle] ?? 0,
        }))}
      />
      <ShopBrowser products={products} {...props} />
    </>
  );
}
