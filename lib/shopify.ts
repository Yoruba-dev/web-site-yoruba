import type { Money, Product } from "./types";
import { deriveTags } from "./categorize";

// ---------------------------------------------------------------------------
// Low-level Shopify Storefront API client.
//
// Activates automatically when these env vars are present (.env.local):
//   SHOPIFY_STORE_DOMAIN          e.g. your-store.myshopify.com
//   SHOPIFY_STOREFRONT_ACCESS_TOKEN
// Until then, lib/products.ts falls back to the mock catalogue so the site
// runs with zero configuration.
// ---------------------------------------------------------------------------

const API_VERSION = "2024-10";

// The cart/checkout runs in the browser, so the canonical vars are the public
// (NEXT_PUBLIC_) ones. Server-side reads accept them too, and fall back to the
// legacy server-only names for compatibility.
function storeDomain(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ??
    process.env.SHOPIFY_STORE_DOMAIN
  );
}
function storefrontToken(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ??
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
  );
}

export function isShopifyConfigured(): boolean {
  return Boolean(storeDomain() && storefrontToken());
}

export async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const domain = storeDomain();
  const token = storefrontToken();
  if (!domain || !token) {
    throw new Error("Shopify is not configured.");
  }

  const res = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    // Time-based safety net (~60s) PLUS a "shopify" cache tag so a Shopify product
    // webhook hitting /api/revalidate can refresh the whole catalogue on demand
    // (updates show in seconds instead of waiting for the 60s window).
    next: { revalidate: 60, tags: ["shopify"] },
  });

  if (!res.ok) {
    throw new Error(`Shopify request failed: ${res.status}`);
  }

  const json = (await res.json()) as { data: T; errors?: unknown };
  if (json.errors) {
    throw new Error(`Shopify GraphQL error: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

// --- GraphQL fragments / queries -------------------------------------------

const PRODUCT_FRAGMENT = /* GraphQL */ `
  fragment ProductCard on Product {
    id
    handle
    title
    description
    tags
    availableForSale
    priceRange {
      minVariantPrice { amount currencyCode }
    }
    compareAtPriceRange {
      minVariantPrice { amount currencyCode }
    }
    images(first: 20) {
      edges { node { url altText } }
    }
    options {
      name
    }
    variants(first: 20) {
      edges {
        node {
          id
          title
          availableForSale
          price { amount currencyCode }
          image { url }
        }
      }
    }
    media(first: 10) {
      edges {
        node {
          mediaContentType
          ... on Model3d {
            alt
            sources { url format }
          }
        }
      }
    }
  }
`;

interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  tags: string[];
  availableForSale: boolean;
  priceRange: { minVariantPrice: ShopifyMoney };
  compareAtPriceRange: { minVariantPrice: ShopifyMoney };
  images: { edges: { node: { url: string; altText: string | null } }[] };
  options?: { name: string }[];
  variants: {
    edges: {
      node: {
        id: string;
        title: string;
        availableForSale: boolean;
        price: ShopifyMoney;
        image?: { url: string } | null;
      };
    }[];
  };
  media?: {
    edges: {
      node: {
        mediaContentType: string;
        alt?: string | null;
        sources?: { url: string; format: string }[];
      };
    }[];
  };
}

function reshape(p: ShopifyProduct): Product {
  const compareAt = p.compareAtPriceRange?.minVariantPrice;
  const hasDiscount =
    compareAt && Number(compareAt.amount) > Number(p.priceRange.minVariantPrice.amount);
  const images = p.images.edges.map((e) => ({
    url: e.node.url,
    altText: e.node.altText ?? p.title,
  }));
  if (images.length === 1) images.push(images[0]);

  // First real 3D model uploaded to the product (Shopify serves GLB + auto-USDZ).
  const modelNode = p.media?.edges
    .map((e) => e.node)
    .find((n) => n.mediaContentType === "MODEL_3D" && n.sources?.length);
  const model3d = modelNode?.sources?.length
    ? {
        glb:
          modelNode.sources.find((s) => s.format === "glb")?.url ??
          modelNode.sources[0].url,
        usdz: modelNode.sources.find((s) => s.format === "usdz")?.url,
        alt: modelNode.alt ?? p.title,
      }
    : null;

  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    description: p.description,
    price: p.priceRange.minVariantPrice as Money,
    compareAtPrice: hasDiscount ? (compareAt as Money) : null,
    images,
    badge: hasDiscount ? "Sale" : null,
    availableForSale: p.availableForSale,
    // Merge any real Shopify tags with type/Orisha tags derived from the title,
    // so the shop filters + "Comprar por Orisha" work even when products are untagged.
    tags: Array.from(new Set([...p.tags, ...deriveTags(p.title)])),
    variants: p.variants.edges.map((e) => ({
      id: e.node.id,
      title: e.node.title,
      price: e.node.price as Money,
      availableForSale: e.node.availableForSale,
      image: e.node.image?.url,
    })),
    // Primary option label for the variant selector, skipping Shopify's default
    // single-variant "Title" option (which carries no real choice).
    optionName: p.options?.find((o) => o.name && o.name !== "Title")?.name,
    model3d,
  };
}

interface ProductsPage {
  products: {
    edges: { node: ShopifyProduct }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
}

export async function shopifyGetProducts(first = 24): Promise<Product[]> {
  // Shopify's Storefront API caps `first` at 250 per request, so page through
  // in chunks of 250 until we've collected `first` products (or run out).
  const PAGE = 250;
  const out: Product[] = [];
  let after: string | null = null;

  while (out.length < first) {
    const data: ProductsPage = await shopifyFetch<ProductsPage>(
      /* GraphQL */ `
        ${PRODUCT_FRAGMENT}
        query Products($first: Int!, $after: String) {
          products(first: $first, after: $after, sortKey: BEST_SELLING) {
            edges { node { ...ProductCard } }
            pageInfo { hasNextPage endCursor }
          }
        }
      `,
      { first: Math.min(PAGE, first - out.length), after },
    );
    out.push(...data.products.edges.map((e) => reshape(e.node)));
    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }
  return out;
}

/** Newest products first (by creation date) — powers the home "Recién llegado"
 *  section so a freshly added piece is seen immediately, no searching. */
export async function shopifyGetNewArrivals(n = 10): Promise<Product[]> {
  const data = await shopifyFetch<ProductsPage>(
    /* GraphQL */ `
      ${PRODUCT_FRAGMENT}
      query NewArrivals($n: Int!) {
        products(first: $n, sortKey: CREATED_AT, reverse: true) {
          edges { node { ...ProductCard } }
          pageInfo { hasNextPage endCursor }
        }
      }
    `,
    { n },
  );
  return data.products.edges.map((e) => reshape(e.node));
}

export async function shopifyGetProductByHandle(
  handle: string,
): Promise<Product | null> {
  const data = await shopifyFetch<{ product: ShopifyProduct | null }>(
    /* GraphQL */ `
      ${PRODUCT_FRAGMENT}
      query Product($handle: String!) {
        product(handle: $handle) { ...ProductCard }
      }
    `,
    { handle },
  );
  return data.product ? reshape(data.product) : null;
}

// ---------------------------------------------------------------------------
// Collections — power the home "Categorías de Productos" circles and the
// /collections/[handle] listing pages. Read live from the Storefront API.
// ---------------------------------------------------------------------------
export interface ShopifyCollectionSummary {
  handle: string;
  title: string;
  image: string | null;
}

export async function shopifyGetCollections(
  first = 30,
): Promise<ShopifyCollectionSummary[]> {
  const data = await shopifyFetch<{
    collections: {
      edges: {
        node: { handle: string; title: string; image: { url: string } | null };
      }[];
    };
  }>(
    /* GraphQL */ `
      query Collections($first: Int!) {
        collections(first: $first, sortKey: TITLE) {
          edges { node { handle title image { url } } }
        }
      }
    `,
    { first },
  );
  return data.collections.edges.map((e) => ({
    handle: e.node.handle,
    title: e.node.title,
    image: e.node.image?.url ?? null,
  }));
}

export async function shopifyGetCollectionProducts(
  handle: string,
  first = 48,
): Promise<{ title: string; description: string; products: Product[] } | null> {
  const data = await shopifyFetch<{
    collection: {
      title: string;
      description: string;
      products: { edges: { node: ShopifyProduct }[] };
    } | null;
  }>(
    /* GraphQL */ `
      ${PRODUCT_FRAGMENT}
      query CollectionProducts($handle: String!, $first: Int!) {
        collection(handle: $handle) {
          title
          description
          products(first: $first, sortKey: BEST_SELLING) {
            edges { node { ...ProductCard } }
          }
        }
      }
    `,
    { handle, first },
  );
  if (!data.collection) return null;
  return {
    title: data.collection.title,
    description: data.collection.description,
    products: data.collection.products.edges.map((e) => reshape(e.node)),
  };
}
