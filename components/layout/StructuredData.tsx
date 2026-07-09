import { SITE } from "@/lib/site";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://pedroyorubajewelry.netlify.app";

// schema.org JewelryStore / LocalBusiness — helps Google show the business with
// its address, hours, phone and social profiles in search + maps.
export default function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    name: SITE.name,
    description: SITE.tagline,
    url: siteUrl,
    image: `${siteUrl}/og-image.png`,
    logo: `${siteUrl}/assets/images/logo/pedro-yoruba.png`,
    telephone: SITE.contact.phoneTel,
    email: SITE.contact.email,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: "11865 SW 26th St. c-41",
      addressLocality: "Miami",
      addressRegion: "FL",
      postalCode: "33175",
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: SITE.contact.geo.lat,
      longitude: SITE.contact.geo.lng,
    },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      SITE.contact.mapQuery,
    )}`,
    sameAs: [SITE.social.instagram, SITE.social.facebook, SITE.social.tiktok],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "10:00",
        closes: "17:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "10:00",
        closes: "16:00",
      },
    ],
  };

  // Content is fully static (site config only) with no HTML-special characters,
  // so rendering the JSON as the <script> child is safe (no dangerouslySetInnerHTML).
  return <script type="application/ld+json">{JSON.stringify(data)}</script>;
}
