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
    // Where we actually serve. Added 2026-07-29 after the Google query data
    // showed that the ONLY non-branded search bringing people in is local
    // intent — "joyería cerca de mí", "joyerias 33175 zip code", "joyería
    // miami". Naming the surrounding places (the taller sits in 33175, on the
    // Westchester/Tamiami line) tells Google which "near me" this shop is near.
    // These are the real neighbourhoods and cities around 11865 SW 26th St.
    areaServed: [
      { "@type": "City", name: "Miami" },
      { "@type": "AdministrativeArea", name: "Miami-Dade County" },
      ...[
        "Westchester",
        "Tamiami",
        "Sweetwater",
        "Fontainebleau",
        "Olympia Heights",
        "Kendall",
        "Coral Gables",
        "Hialeah",
      ].map((name) => ({ "@type": "Place", name })),
    ],
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
    // The services the workshop offers, declared on the brand entity itself so
    // every page ties the mark to them (each has its full section on
    // /servicios). alternateName carries the English service name — matches
    // English-language search and the wording of trademark service classes.
    makesOffer: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Joyería por encargo para los Orishas",
          description:
            "Piezas únicas hechas a mano en oro 10k, 14k y 18k: Idde, elekes, herramientas y atributos de cada Oricha, a la medida.",
        },
      },
      {
        "@type": "Offer",
        // Referencia al nodo que declara /servicios — mismo @id, no un duplicado.
        itemOffered: { "@id": `${siteUrl}/servicios#diseno` },
      },
      {
        "@type": "Offer",
        // Referencia al nodo que declara /servicios — mismo @id, no un duplicado.
        itemOffered: { "@id": `${siteUrl}/servicios#grabado` },
      },
      {
        "@type": "Offer",
        // Referencia al nodo que declara /servicios — mismo @id, no un duplicado.
        itemOffered: { "@id": `${siteUrl}/servicios#autenticacion` },
      },
      {
        "@type": "Offer",
        // Referencia al nodo que declara /servicios — mismo @id, no un duplicado.
        itemOffered: { "@id": `${siteUrl}/servicios#consultoria` },
      },
    ],
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
