import type { Product } from "./types";
import { getProductRating } from "./judgeme";

// Attach REAL Judge.me review ratings to a list of products (server-side only).
//
// Judge.me's public token has no bulk endpoint, so we look ratings up per handle.
// getProductRating is cached (React per-request memo) and its fetch is held in
// Next's data cache for an hour, so across renders each handle is fetched at most
// once/hour — this concurrency-limited pass only pays that cost on a cache miss.
// If Judge.me isn't configured the lookups return null and products come back
// unchanged (no stars), so this is always safe to call.
export async function attachRatings(
  products: Product[],
  concurrency = 10,
): Promise<Product[]> {
  const out = products.slice();
  let next = 0;

  async function worker() {
    while (next < out.length) {
      const idx = next++;
      const p = out[idx];
      try {
        const reviewRating = await getProductRating(p.handle);
        out[idx] = { ...p, reviewRating };
      } catch {
        // leave the product as-is (no stars) on any lookup failure
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, out.length) },
    worker,
  );
  await Promise.all(workers);
  return out;
}
