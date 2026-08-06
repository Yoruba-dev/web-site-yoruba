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

// A Service offered by the workshop. `provider` references the global
// JewelryStore node (#store) that StructuredData.tsx emits on every page, so
// the service is machine-readably tied to the brand without repeating the
// address here. `alternateName` carries the English service name — useful for
// English-language search AND for matching the wording used in trademark
// service classes.
export function serviceSchema(opts: {
  name: string;
  alternateName?: string;
  serviceType: string;
  description: string;
  path: string;
  /** Dónde se presta. Por defecto todo el país; un servicio presencial (la
   *  autenticación se hace con la pieza en el mostrador) pasa su propia zona
   *  para que el dato estructurado no prometa más de lo que dice la página. */
  areaServed?: { type: string; name: string };
}) {
  const area = opts.areaServed ?? { type: "Country", name: "United States" };
  return {
    "@context": "https://schema.org",
    // @id estable = el ancla de su sección. Así el nodo de la marca (#store)
    // puede REFERENCIAR este mismo nodo en vez de duplicarlo, y el grafo dice
    // una sola vez que esta marca presta este servicio.
    "@id": `${SITE_URL}${opts.path}`,
    "@type": "Service",
    name: opts.name,
    ...(opts.alternateName && { alternateName: opts.alternateName }),
    serviceType: opts.serviceType,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    areaServed: { "@type": area.type, name: area.name },
    provider: { "@id": `${SITE_URL}/#store` },
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
