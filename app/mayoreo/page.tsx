import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ProductSlider from "@/components/product/ProductSlider";
import JsonLd from "@/components/seo/JsonLd";
import { getProducts } from "@/lib/products";
import { attachRatings } from "@/lib/product-ratings";
import { whatsappWholesaleUrl } from "@/lib/commerce";
import { SITE } from "@/lib/site";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://pedrojewelryyoruba.com";

export const metadata: Metadata = {
  title: "Venta mayorista de herramientas de santo para botánicas",
  description:
    "Herramientas de santo al por mayor para botánicas y tiendas: remos de Oshún, muletas de San Lázaro y los atributos de cada Oricha, en acero inoxidable con garantía de por vida y en oro por encargo. Hechas a mano en Miami — pide tu catálogo de mayorista por WhatsApp.",
  keywords: [
    "herramientas de santo al por mayor",
    "herramientas de orisha mayoreo",
    "mayoreo botánicas",
    "proveedor de botánicas joyería",
    "atributos de orishas al por mayor",
    "herramientas de acero inoxidable santería",
    "joyería yoruba mayorista miami",
    "wholesale orisha tools",
  ],
  alternates: { canonical: "/mayoreo" },
  openGraph: {
    type: "website",
    title: "Venta mayorista de herramientas de santo — Pedro Yoruba Jewelry",
    description:
      "Herramientas de los Orishas al por mayor para botánicas y tiendas. Acero inoxidable con garantía de por vida y oro por encargo, hechas a mano en Miami.",
    url: "/mayoreo",
    locale: "es_US",
  },
};

// Revalidate daily — the product row comes from the live catalogue.
export const revalidate = 86400;

// Concrete selling points — specific to the herramientas line, not generic filler.
const POINTS = [
  {
    head: "Acero inoxidable, garantía de por vida",
    body: "No se oxidan ni pierden brillo. Aguantan la vitrina y el uso — el cliente vuelve, no reclama.",
  },
  {
    head: "También en oro, por encargo",
    body: "Cuando tu clientela pide oro 10k o 14k, te las hacemos a la medida del santo.",
  },
  {
    head: "Todos los Orishas",
    body: "Remos de Oshún, muletas de San Lázaro, atributos de Obatalá, Yemayá, Olokun, Ochosi y más.",
  },
  {
    head: "Hechas a mano en Miami",
    body: "Del taller a tu mostrador, sin intermediarios y con precio de mayorista.",
  },
];

const STEPS = [
  {
    num: 1,
    title: "Escríbenos por WhatsApp",
    text: "Dinos que tienes una botánica o tienda y qué herramientas te interesan.",
  },
  {
    num: 2,
    title: "Catálogo y precios de mayorista",
    text: "Te pasamos el catálogo con los precios de mayorista y las cantidades mínimas.",
  },
  {
    num: 3,
    title: "Coordinamos y enviamos",
    text: "Armamos tu pedido, lo confirmamos y te lo enviamos a tu tienda en todo USA.",
  },
];

export default async function MayoreoPage() {
  const all = await getProducts(150);
  const herramientas = all.filter((p) => p.tags.includes("Herramientas"));
  // Featured slice with real review stars attached.
  const herramientasFeatured = await attachRatings(herramientas.slice(0, 12));
  const heroImg =
    herramientas.find((p) => p.images?.[0]?.url)?.images[0] ?? null;
  const wa = whatsappWholesaleUrl();

  // Structured data — a wholesale Service, for topic-specific positioning.
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Venta mayorista de herramientas de santo para botánicas",
    serviceType: "Venta al por mayor de joyería y herramientas religiosas",
    description:
      "Herramientas de los Orishas al por mayor para botánicas y tiendas: acero inoxidable con garantía de por vida y oro por encargo, hechas a mano en Miami.",
    url: `${siteUrl}/mayoreo`,
    areaServed: { "@type": "Country", name: "United States" },
    audience: { "@type": "BusinessAudience", name: "Botánicas, santeros y tiendas religiosas" },
    provider: {
      "@type": "JewelryStore",
      name: SITE.name,
      telephone: SITE.contact.phoneTel,
      email: SITE.contact.email,
      url: siteUrl,
      address: {
        "@type": "PostalAddress",
        streetAddress: "11865 SW 26th St. c-41",
        addressLocality: "Miami",
        addressRegion: "FL",
        postalCode: "33175",
        addressCountry: "US",
      },
    },
  };

  return (
    <>
      <Breadcrumb title="Mayorista" crumbs={[{ label: "Mayorista" }]} />
      <JsonLd data={serviceSchema} />

      {/* Editorial hero — asymmetric, anchored by a real herramienta photo. */}
      <section className="pyj-may">
        <div className="container">
          <div className="pyj-may_hero">
            <div className="pyj-may_hero-text">
              <span className="pyj-kicker">Venta al por mayor</span>
              <h1>
                Herramientas de santo
                <br />
                para tu botánica
              </h1>
              <p className="pyj-may_lede">
                Somos el taller. Surtimos a botánicas, santeros y tiendas con los
                atributos de cada Oricha —hechos a mano en Miami— para que los
                revendas con buen margen. Empezamos por lo que más rota: las{" "}
                <strong>herramientas</strong>.
              </p>
              <div className="pyj-may_cta">
                <a className="pyj-btn-gold" href={wa} target="_blank" rel="noreferrer">
                  Pide tu catálogo por WhatsApp
                </a>
                <a className="pyj-may_phone" href={`tel:${SITE.contact.phoneTel}`}>
                  o llama al {SITE.contact.phone}
                </a>
              </div>
            </div>
            <div className="pyj-may_hero-media">
              {heroImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroImg.url}
                  alt={heroImg.altText || "Herramientas de santo hechas a mano — venta mayorista"}
                />
              ) : (
                <div className="pyj-may_hero-fallback" aria-hidden="true">
                  ✦
                </div>
              )}
              <span className="pyj-may_tag">Herramientas</span>
            </div>
          </div>
        </div>
      </section>

      {/* Proposition — botánica explainer + concrete selling points (editorial,
          not a grid of identical cards). */}
      <section className="pyj-may_intro">
        <div className="container">
          <div className="pyj-may_grid">
            <div>
              <h2>El proveedor de tu tienda religiosa</h2>
              <p>
                Una <strong>botánica</strong> es la tienda de artículos religiosos
                y espirituales —velas, hierbas, imágenes de santos y Orishas,
                collares, amuletos— que sirve a la comunidad de la Santería (Regla
                de Ocha), Ifá y Espiritismo.
              </p>
              <p>
                Si tienes una, nosotros te ponemos las{" "}
                <strong>herramientas</strong>: los remos, las muletas y los
                atributos que tu clientela busca para su santo. Tú pones la
                vitrina; nosotros ponemos la calidad, la variedad y el precio de
                mayorista.
              </p>
            </div>
            <ul className="pyj-may_points">
              {POINTS.map((p) => (
                <li key={p.head}>
                  <strong>{p.head}</strong>
                  {p.body}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* The line itself — real herramientas from the catalogue. */}
      {herramientas.length > 0 && (
        <section className="hiraola-product_area">
          <div className="container">
            <div className="row">
              <div className="col-lg-12">
                <div
                  className="hiraola-section_title"
                  style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}
                >
                  <div>
                    <h4 style={{ margin: 0 }}>Las herramientas que revenderás</h4>
                    <p style={{ margin: "6px 0 0", fontSize: 14, color: "#a99d83" }}>
                      Una muestra de la línea. En acero desde $60 — y en oro por encargo.
                    </p>
                  </div>
                  <a
                    href={wa}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--pyj-gold)", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap" }}
                  >
                    Pedir catálogo →
                  </a>
                </div>
              </div>
              <div className="col-lg-12">
                <ProductSlider products={herramientasFeatured} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Cómo pedir — a real 3-step sequence, so the numbering is meaningful. */}
      <section className="pyj-may_steps-sec">
        <div className="container">
          <div className="hiraola-section_title" style={{ marginBottom: 24 }}>
            <h4>Cómo pedir al por mayor</h4>
          </div>
          <div className="pyj-steps">
            {STEPS.map((s) => (
              <div className="pyj-step" key={s.num}>
                <div className="pyj-step_num" aria-hidden="true">
                  {s.num}
                </div>
                <h5>{s.title}</h5>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA band. */}
      <div className="pyj-ctaband">
        <div className="container">
          <h3>Surte tu botánica con herramientas de verdad</h3>
          <p>
            Escríbenos por WhatsApp o llámanos — te pasamos el catálogo de
de mayorista y coordinamos tu primer pedido.
          </p>
          <div className="pyj-may_cta" style={{ justifyContent: "center" }}>
            <a className="pyj-btn-gold" href={wa} target="_blank" rel="noreferrer">
              Pide tu catálogo por WhatsApp
            </a>
            <a className="pyj-may_phone" href={`tel:${SITE.contact.phoneTel}`}>
              o llama al {SITE.contact.phone}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
