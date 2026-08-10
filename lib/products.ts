import { cache } from "react";
import { isKidsProduct } from "./kids";
import type { Product } from "./types";
import { MOCK_PRODUCTS } from "./mock-data";
import {
  isShopifyConfigured,
  shopifyGetCollectionProducts,
  shopifyGetCollections,
  shopifyGetNewArrivals,
  shopifyGetProductByHandle,
  shopifyGetProducts,
  shopifyGetCollectionCounts,
} from "./shopify";

/** A Shopify collection surfaced as a browsable category (home circles + pages). */
export interface CategoryCollection {
  handle: string;
  title: string;
  image: string | null;
}

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
  async (rawHandle: string): Promise<Product | null> => {
    // Route params can arrive percent-encoded (e.g. the emoji handle
    // "corona-%F0%9F%91%9110k") — Shopify only matches the DECODED handle, so
    // those product pages 404'd. Decoding here fixes every caller at once;
    // it's a no-op for already-decoded handles.
    let handle = rawHandle;
    try {
      handle = decodeURIComponent(rawHandle);
    } catch {
      /* malformed escape — use as-is */
    }
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

/** Live Shopify collections shown as home "category circles". Only ones with an
 *  image, excluding obvious duplicates (e.g. "… (copia)"). Empty if Shopify is off. */
export const getCollections = cache(async (): Promise<CategoryCollection[]> => {
  if (!isShopifyConfigured()) return [];
  try {
    const cols = await shopifyGetCollections(30);
    return cols.filter(
      (c) => c.image && !/copia|copy/i.test(c.handle) && !/copia|copy/i.test(c.title),
    );
  } catch (err) {
    console.error("[shopify] getCollections failed:", err);
    return [];
  }
});

/** Las piezas de la sección de Niños: las que llevan la etiqueta `ninos` en
 *  Shopify. Reutiliza `getProducts`, que ya está cacheado, así que la página de
 *  Niños no dispara una consulta extra al catálogo. Ver lib/kids.ts. */
export const getKidsProducts = cache(async (): Promise<Product[]> => {
  const all = await getProducts(250);
  return all.filter(isKidsProduct);
});

/** A single collection's title/description + its products, for /collections/[handle]. */
export const getCollectionProducts = cache(
  async (
    handle: string,
  ): Promise<{ title: string; description: string; products: Product[] } | null> => {
    if (!isShopifyConfigured()) return null;
    try {
      return await shopifyGetCollectionProducts(handle);
    } catch (err) {
      console.error("[shopify] getCollectionProducts failed:", err);
      return null;
    }
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

/** Piece counts per collection, for the shop's category rail. Cached with the
 *  rest of the catalogue; empty when Shopify is off so the rail simply omits
 *  them rather than showing zeros. */
export const getCollectionCounts = cache(
  async (): Promise<Record<string, number>> => {
    if (!isShopifyConfigured()) return {};
    try {
      return await shopifyGetCollectionCounts();
    } catch (err) {
      console.error("[shopify] getCollectionCounts failed:", err);
      return {};
    }
  },
);
