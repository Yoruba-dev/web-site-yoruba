import { getProducts } from "@/lib/products";
import ShopBrowser from "./ShopBrowser";

// Server wrapper: fetches the catalogue, then hands it to the client-side
// ShopBrowser which renders the (functional) filters + grid/list. One component
// drives all 7 shop routes via props.
export interface ShopContentProps {
  sidebar?: "left" | "right";
  view?: "grid" | "list";
  columns?: 3 | 4;
}

export default async function ShopContent(props: ShopContentProps) {
  // Show the full catalogue on the shop pages (the filters/sort narrow it down).
  const products = await getProducts(500);
  return <ShopBrowser products={products} {...props} />;
}
