import { cache } from "react";
import { getProductByHandle } from "./products";
import { FEATURED_OFFER_HANDLE } from "./site";
import { sizedImageUrl, formatMoney } from "./utils";

// Small, serializable view-model for the featured promo. Shared by the home
// "Oferta destacada" band (FeaturedOffer) and the startup popup, so both read the
// same source and stay in sync.
export interface FeaturedOfferVM {
  title: string;
  href: string;
  image?: string; // already width-sized
  pct: number; // e.g. 20 (percent off)
  was: string; // formatted original price, e.g. "$900.00"
  now: string; // formatted sale price, e.g. "$720.00"
  saved: string; // formatted amount saved, e.g. "$180.00"
}

// Reads the configured featured product LIVE and returns the offer ONLY when it's
// genuinely on sale (compareAtPrice > price) — so the promo (banner + popup) turns
// itself on when the piece is discounted and off when the sale ends, with no code
// change. Returns null when there's no active offer. Change FEATURED_OFFER_HANDLE
// (lib/site.ts) to feature a different piece.
export const getFeaturedOffer = cache(
  async (): Promise<FeaturedOfferVM | null> => {
    const product = await getProductByHandle(FEATURED_OFFER_HANDLE);
    if (!product || !product.compareAtPrice) return null;

    const now = Number(product.price.amount);
    const was = Number(product.compareAtPrice.amount);
    if (!(was > now)) return null;

    return {
      title: product.title,
      href: `/products/${product.handle}`,
      image: product.images[0]?.url
        ? sizedImageUrl(product.images[0].url, 900)
        : undefined,
      pct: Math.round((1 - now / was) * 100),
      was: formatMoney(product.compareAtPrice),
      now: formatMoney(product.price),
      saved: formatMoney({
        amount: (was - now).toFixed(2),
        currencyCode: product.price.currencyCode,
      }),
    };
  },
);
