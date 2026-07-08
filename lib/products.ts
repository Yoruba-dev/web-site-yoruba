import { cache } from "react";
import type { Product } from "./types";
import { MOCK_PRODUCTS } from "./mock-data";
import {
  isShopifyConfigured,
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

/** Convenience slices for the homepage sections. */
export async function getHomeSections() {
  const products = await getProducts(24);
  return {
    newArrivals: products.slice(0, 8),
    trending: products.slice(2, 10),
    special: products.slice(4, 12),
  };
}
