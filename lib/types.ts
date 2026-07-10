// Shared domain types. Shaped to mirror Shopify's Storefront API so that
// swapping the mock data layer for live Shopify data requires no component changes.

export interface Money {
  amount: string;
  currencyCode: string;
}

export interface ProductImage {
  url: string;
  altText: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  price: Money;
  availableForSale: boolean;
}

export interface Model3D {
  /** GLB model URL — used for the on-page 3D viewer and Android AR. */
  glb: string;
  /** USDZ URL for iOS AR (Shopify auto-generates it from the GLB). */
  usdz?: string;
  alt?: string;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  description: string;
  /** Lowest variant price (the "new"/current price). */
  price: Money;
  /** Original price when on sale, otherwise null. */
  compareAtPrice: Money | null;
  /** [0] = primary image, [1] = hover/secondary image. */
  images: ProductImage[];
  /** 0–5, used by the star rating box. */
  rating: number;
  /** Corner sticker text e.g. "New", "-10%". null = no sticker. */
  badge: string | null;
  availableForSale: boolean;
  tags: string[];
  variants: ProductVariant[];
  /** Real 3D model (from Shopify product media), when the piece has one. */
  model3d?: Model3D | null;
}

export interface Collection {
  handle: string;
  title: string;
  products: Product[];
}
