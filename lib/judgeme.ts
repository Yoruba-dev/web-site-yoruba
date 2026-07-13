import { cache } from "react";

// Judge.me reviews — reads the REAL average rating + review count per product
// from Judge.me's public widget API (server-side), so the site shows genuine
// stars, never invented ones. Returns null when there are no reviews yet or the
// integration isn't configured, so callers simply render nothing.
//
// Config (in .env.local, and in Netlify for production):
//   JUDGEME_PUBLIC_TOKEN            — the Judge.me public token
//   NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN — the *.myshopify.com domain (reused)

const TOKEN = process.env.JUDGEME_PUBLIC_TOKEN;
const SHOP = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;

export interface Rating {
  rating: number;
  count: number;
}

export const getProductRating = cache(
  async (handle: string): Promise<Rating | null> => {
    if (!TOKEN || !SHOP) return null;
    try {
      const url =
        `https://judge.me/api/v1/widgets/product_review?api_token=${TOKEN}` +
        `&shop_domain=${SHOP}&handle=${encodeURIComponent(handle)}`;
      // Cache for an hour — reviews don't change second-to-second.
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) return null;
      const json = (await res.json()) as { widget?: string };
      const w = json.widget ?? "";
      const count = parseInt(
        w.match(/data-number-of-reviews=['"](\d+)['"]/)?.[1] ?? "0",
        10,
      );
      if (!count) return null; // no reviews → show nothing
      const rating = parseFloat(
        w.match(/data-average-rating=['"]([\d.]+)['"]/)?.[1] ?? "0",
      );
      return { rating, count };
    } catch {
      return null;
    }
  },
);
