import { SITE, SITE_URL as siteUrl } from "@/lib/site";
import JsonLd from "@/components/seo/JsonLd";

// Global schema.org graph — JewelryStore (LocalBusiness) + WebSite. Helps
// Google show the business with address/hours/phone in search + maps, and
// gives AI answer engines (ChatGPT, Perplexity, AI Overviews) a machine-
// readable identity for the brand. Product/FAQ/Breadcrumb schemas live on
// their own pages; this file is only the site-wide identity.
export default function StructuredData() {
  const store = {
    "@type": "JewelryStore",
    "@id": `${siteUrl}/#store`,
    name: SITE.name,
    description: SITE.tagline,
    url: siteUrl,
    image: `${siteUrl}/og-image.png`,
    logo: `${siteUrl}/assets/images/logo/pedro-yoruba.png`,
    telephone: SITE.contact.phoneTel,
    email: SITE.contact.email,
    priceRange: "$$",
    currenciesAccepted: "USD",
    paymentAccepted: "Visa, MasterCard, American Express, Discover, Debit, NFC",
    knowsLanguage: ["es", "en"],
    keywords:
      "joyería yoruba, santería, orishas, idde de orula, elekes, herramientas de santo, oro 10k 14k 18k, joyería miami",
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
    makesOffer: {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Joyería por encargo para los Orishas",
        description:
          "Piezas únicas hechas a mano en oro 10k, 14k y 18k: Idde, elekes, herramientas y atributos de cada Oricha, a la medida.",
      },
    },
  };

  const website = {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: SITE.name,
    inLanguage: "es",
    publisher: { "@id": `${siteUrl}/#store` },
  };

  return <JsonLd data={{ "@context": "https://schema.org", "@graph": [store, website] }} />;
}
