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
    // Catalogue refreshes from Shopify ~every 60s (near-real-time). For truly
    // instant updates, add a Shopify product webhook → an /api/revalidate route.
    next: { revalidate: 60 },
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
    images(first: 2) {
      edges { node { url altText } }
    }
    variants(first: 20) {
      edges {
        node {
          id
          title
          availableForSale
          price { amount currencyCode }
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
  variants: {
    edges: {
      node: {
        id: string;
        title: string;
        availableForSale: boolean;
        price: ShopifyMoney;
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

  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    description: p.description,
    price: p.priceRange.minVariantPrice as Money,
    compareAtPrice: hasDiscount ? (compareAt as Money) : null,
    images,
    rating: 5,
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
    })),
  };
}

export async function shopifyGetProducts(first = 24): Promise<Product[]> {
  // Shopify's Storefront API caps `first` at 250 per request, so page through
  // in chunks of 250 until we've collected `first` products (or run out).
  const PAGE = 250;
  const out: Product[] = [];
  let after: string | null = null;

  while (out.length < first) {
    const data = await shopifyFetch<{
      products: {
        edges: { node: ShopifyProduct }[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    }>(
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
