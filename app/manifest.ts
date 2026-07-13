import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Web app manifest — install-to-home-screen metadata and the brand colors
// mobile browsers use for the UI around the page.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: "Pedro Yoruba",
    description: SITE.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#0d0a07",
    theme_color: "#0d0a07",
    icons: [
      { src: "/icon.png", sizes: "any", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
