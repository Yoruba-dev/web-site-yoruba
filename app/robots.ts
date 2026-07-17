import type { MetadataRoute } from "next";
import { SITE_URL as siteUrl } from "@/lib/site";

// Private / no-SEO-value routes.
const PRIVATE = ["/checkout", "/cart", "/my-account", "/login-register", "/api/"];

// /shop is a simpler duplicate of the real shop (/shop-left-sidebar) and
// product pages (/products/*) — kept live as a lightweight CTA destination
// (footer, banners, checkout "keep shopping") but noindexed so it doesn't
// dilute ranking against the indexed pages it duplicates. /compare, /wishlist
// and /coming-soon are real utility/placeholder pages with no SEO value.
const DEMO_VARIANTS = ["/shop$", "/compare", "/wishlist", "/coming-soon"];

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
