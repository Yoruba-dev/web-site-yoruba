import { cache } from "react";
import type { Product } from "./types";
import { MOCK_PRODUCTS } from "./mock-data";
import {
  isShopifyConfigured,
  shopifyGetNewArrivals,
  shopifyGetProductByHandle,
  shopifyGetProducts,
} from "./shopify";

// Single data-access layer for the whole app. Components import from here and
// never need to know whether the data is mock or live Shopify.

export const getProducts = cache(async (limit = 24): Promise<Product[]> => {
  if (isShopifyConfigured()) {
    try {
      return (await shopifyGetProducts(limit)).slice(0, limit);
    } catch (err) {
      console.error("[shopify] getProducts failed, using mock data:", err);
    }
  }
  return MOCK_PRODUCTS.slice(0, limit);
});

/** Newest products first, for the home "Recién llegado" showcase. Falls back to
 *  the head of the mock catalogue when Shopify isn't configured. */
export const getNewArrivals = cache(async (limit = 10): Promise<Product[]> => {
  if (isShopifyConfigured()) {
    try {
      return await shopifyGetNewArrivals(limit);
    } catch (err) {
      console.error("[shopify] getNewArrivals failed, using mock data:", err);
    }
  }
  return MOCK_PRODUCTS.slice(0, limit);
});

export const getProductByHandle = cache(
  async (handle: string): Promise<Product | null> => {
    if (isShopifyConfigured()) {
      try {
        return await shopifyGetProductByHandle(handle);
      } catch (err) {
        console.error("[shopify] getProductByHandle failed, using mock:", err);
      }
    }
    return MOCK_PRODUCTS.find((p) => p.handle === handle) ?? null;
  },
);

/** A representative image for a category (the first catalogue product tagged with
 *  it) — used as the breadcrumb banner background when browsing that category. */
export async function getCategoryImage(
  category: string | undefined,
): Promise<string | undefined> {
  if (!category) return undefined;
  const products = await getProducts(250);
  const match = products.find(
    (p) => p.tags.includes(category) && p.images[0]?.url,
  );
  return match?.images[0]?.url;
}

/** Convenience slices for the homepage sections. */
export async function getHomeSections() {
  const products = await getProducts(24);
  return {
    newArrivals: products.slice(0, 8),
    trending: products.slice(2, 10),
    special: products.slice(4, 12),
  };
}
