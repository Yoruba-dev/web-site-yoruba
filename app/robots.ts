import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://pedroyorubajewelry.netlify.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // No SEO value / private — keep crawlers out.
      disallow: ["/checkout", "/cart", "/my-account", "/login-register", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
