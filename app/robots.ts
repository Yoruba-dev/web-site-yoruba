import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://pedrojewelryyoruba.com";

// Private / no-SEO-value routes.
const PRIVATE = ["/checkout", "/cart", "/my-account", "/login-register", "/api/"];

// Template demo layout variants — they render the same content as the real
// shop (/shop-left-sidebar) and product pages (/products/*), so letting them
// be crawled creates duplicate content that dilutes ranking.
const DEMO_VARIANTS = [
  "/shop$",
  "/shop-3-column",
  "/shop-4-column",
  "/shop-right-sidebar",
  "/shop-list-fullwidth",
  "/shop-list-left-sidebar",
  "/shop-list-right-sidebar",
  "/single-product",
  "/compare",
  "/wishlist",
  "/coming-soon",
];

export default function robots(): MetadataRoute.Robots {
  const disallow = [...PRIVATE, ...DEMO_VARIANTS];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      // AI answer engines — explicitly welcome so the brand can be cited in
      // ChatGPT, Claude, Perplexity, Gemini and Google AI Overviews.
      { userAgent: "GPTBot", allow: "/", disallow: PRIVATE },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: PRIVATE },
      { userAgent: "ChatGPT-User", allow: "/", disallow: PRIVATE },
      { userAgent: "ClaudeBot", allow: "/", disallow: PRIVATE },
      { userAgent: "Claude-SearchBot", allow: "/", disallow: PRIVATE },
      { userAgent: "PerplexityBot", allow: "/", disallow: PRIVATE },
      { userAgent: "Google-Extended", allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
