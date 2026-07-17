import { SITE_URL } from "./site";

// Shared schema.org JSON-LD builders — every page that needs a BreadcrumbList,
// FAQPage, CollectionPage or ItemList calls these instead of hand-rolling the
// same object shape. Keeps one source of truth for how each schema type is
// built (and for the absolute-URL prefixing via SITE_URL).

export function breadcrumbSchema(items: { name: string; url?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.url && { item: `${SITE_URL}${item.url}` }),
    })),
  };
}

export function faqPageSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function collectionPageSchema(opts: {
  handle: string;
  name: string;
  description: string;
}) {
  const url = `${SITE_URL}/collections/${opts.handle}`;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#page`,
    name: opts.name,
    description: opts.description,
    url,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#store` },
    mainEntity: { "@id": `${url}#itemlist` },
  };
}

export function itemListSchema(opts: {
  handle: string;
  items: { handle: string; title: string; image?: string }[];
}) {
  const url = `${SITE_URL}/collections/${opts.handle}`;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${url}#itemlist`,
    itemListElement: opts.items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/products/${item.handle}`,
      name: item.title,
      ...(item.image && { image: item.image }),
    })),
  };
}
