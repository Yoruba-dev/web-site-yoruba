"use client";

import { useState } from "react";

// Drop-in <img> replacement that never shows a broken-image icon. If the source
// is missing or fails to load, it swaps to a branded placeholder (dark card with
// a gold ✦) that fills the same box — so a dead Shopify/CDN URL degrades
// gracefully instead of breaking the layout.
const FALLBACK =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">` +
      `<rect width="600" height="600" fill="#18130d"/>` +
      `<text x="300" y="300" font-family="Georgia,serif" font-size="180" fill="#cda557" text-anchor="middle" dominant-baseline="central">&#10022;</text>` +
      `</svg>`,
  );

type SafeImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "onError"
> & {
  src?: string | null;
  /** Optional custom fallback; defaults to the branded placeholder. */
  fallback?: string;
};

export default function SafeImage({
  src,
  alt = "",
  fallback = FALLBACK,
  ...rest
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = failed || !src ? fallback : src;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
