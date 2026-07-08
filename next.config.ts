import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project (avoids the multi-lockfile warning).
  turbopack: {
    root: __dirname,
  },
  // When you later switch product images to next/image with Shopify's CDN,
  // allow its domain here:
  // images: { remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com" }] },
};

export default nextConfig;
