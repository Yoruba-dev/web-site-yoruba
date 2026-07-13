import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/products";
import { ARTICLES } from "@/lib/blog-data";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://pedrojewelryyoruba.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPaths: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/shop-left-sidebar", priority: 0.9 },
    { path: "/blog", priority: 0.7 },
    { path: "/about-us", priority: 0.7 },
    { path: "/contact", priority: 0.7 },
    { path: "/faq", priority: 0.6 },
  ];

  // Blog articles — long-tail SEO landing pages.
  const blogEntries: MetadataRoute.Sitemap = ARTICLES.map((a) => ({
    url: `${siteUrl}/blog/${a.slug}`,
    lastModified: new Date(a.date + "T12:00:00"),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${siteUrl}${p.path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: p.priority,
  }));

  // Include every product page so the whole catalogue gets indexed.
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts(250);
    productEntries = products.map((p) => ({
      url: `${siteUrl}/products/${p.handle}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch {
    // If the catalogue can't be fetched at build time, ship the static sitemap.
  }

  return [...staticEntries, ...blogEntries, ...productEntries];
}
