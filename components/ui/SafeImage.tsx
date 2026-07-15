"use client";

import { useState } from "react";

// Drop-in <img> replacement that never shows a broken-image icon. If the source
// is missing or fails to load, it swaps to a branded placeholder (dark card with
// a gold ✦) that fills the same box — so a dead Shopify/CDN URL degrades
// gracefully instead of breaking the layout.
//
// It ALSO does two things critical for mobile memory/performance:
//  1. `width` → asks the Shopify CDN for a right-sized image (`?width=N`). The
//     store's originals are full-resolution iPhone photos (3024×4032, often
//     .heic) — rendering ~300 of them at full size on the shop grid exhausts a
//     phone's memory and crashes the tab. The width param also transcodes .heic
//     → a web format that browsers decode cheaply.
//  2. lazy loading + async decoding by default, so off-screen images never
//     download or decode until they're needed.
const FALLBACK =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">` +
      `<rect width="600" height="600" fill="#18130d"/>` +
      `<text x="300" y="300" font-family="Georgia,serif" font-size="180" fill="#cda557" text-anchor="middle" dominant-baseline="central">&#10022;</text>` +
      `</svg>`,
  );

/** Ask the Shopify CDN for a `width`-sized (and web-transcoded) variant. No-op
 *  for non-Shopify URLs, data URIs, or when a width is already present. */
function sized(src: string, width?: number): string {
  if (!width || !src.includes("cdn.shopify.com/")) return src;
  if (/[?&]width=/.test(src)) return src;
  return `${src}${src.includes("?") ? "&" : "?"}width=${width}`;
}

type SafeImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "onError"
> & {
  src?: string | null;
  /** Optional custom fallback; defaults to the branded placeholder. */
  fallback?: string;
  /** Target render width in px — appended to Shopify CDN URLs. Pass ~2× the CSS
   *  size for retina (e.g. a 160px card image → width={400}). */
  width?: number;
};

export default function SafeImage({
  src,
  alt = "",
  fallback = FALLBACK,
  width,
  loading = "lazy",
  decoding = "async",
  ...rest
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = failed || !src ? fallback : sized(src, width);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      loading={loading}
      decoding={decoding}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
