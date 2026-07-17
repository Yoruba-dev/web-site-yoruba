import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/layout/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import ProductSlider from "@/components/product/ProductSlider";
import { getProducts } from "@/lib/products";
import { attachRatings } from "@/lib/product-ratings";
import { SITE, SITE_URL as siteUrl, OG_IMAGE } from "@/lib/site";
import { breadcrumbSchema as buildBreadcrumbSchema, faqPageSchema } from "@/lib/schema";

// Pillar landing page for local + AI search: "joyería en Miami" and the whole
// cluster around it (joyería de oro, artesanal, religiosa, yoruba, reparación).
// Modeled on what ranks today for these queries (long-form local guide with a
// direct-answer synthesis, numbered sections, exact NAP and an owner CTA) and
// upgraded with what those pages lack: a real price table, FAQPage schema and
// 134-167-word self-contained blocks that AI engines can quote.
export const metadata: Metadata = {
  title: "Joyería en Miami: oro real 10k, 14k y 18k hecho a mano",
  description:
    "Taller-joyería en Miami (Tamiami/Westchester): piezas de oro 10k, 14k y 18k hechas a mano, joyería religiosa yoruba, reparaciones y encargos. Precios reales y garantía de por vida.",
  alternates: { canonical: "/joyeria-en-miami" },
  openGraph: {
    type: "article",
    images: OG_IMAGE,
    title: "Joyería en Miami: oro real 10k, 14k y 18k hecho a mano",
    description:
      "Guía honesta para comprar joyería de oro en Miami — y por qué un taller que fabrica sus propias piezas te conviene más que una vitrina.",
    url: `${siteUrl}/joyeria-en-miami`,
    locale: "es_US",
  },
};

// Real questions shoppers ask — answers grounded in the store's actual data
// (same facts as /faq), emitted as FAQPage schema for rich results + AI cites.
const GUIDE_FAQS = [
  {
    q: "¿Dónde hay una joyería de oro artesanal en Miami?",
    a: `Pedro Yoruba Jewelry está en ${SITE.contact.address}, en el oeste de Miami (zona de Tamiami, junto a Westchester). Es un taller-joyería: las piezas de oro 10k, 14k y 18k se fabrican a mano en el mismo lugar. Atiende de lunes a viernes de 10:00 a 5:00 y sábados de 10:00 a 4:00.`,
  },
  {
    q: "¿Qué es mejor: oro 10k, 14k o 18k?",
    a: "Depende del uso. El 10k es el más duro y económico — ideal para piezas de uso diario como un Idde o una esclava. El 14k equilibra pureza y resistencia. El 18k tiene más oro y un color más intenso, pero es más suave y costoso. En un taller puedes encargar la misma pieza en el quilate que prefieras.",
  },
  {
    q: "¿Cuánto cuesta la joyería en un taller de Miami?",
    a: "En Pedro Yoruba Jewelry hay herramientas de santo en acero desde $60, azabaches desde $60, Idde de plata desde $370, anillos de Ifá en oro desde $700 e Idde de Orula en oro 10k macizo desde $4,800. Las piezas por encargo se cotizan según el peso en gramos y el quilate.",
  },
  {
    q: "¿Hacen piezas por encargo?",
    a: "Sí. La mayoría de las piezas religiosas (Idde, coronas, herramientas en oro, piezas de fundamento) se hacen por encargo, a la medida del cliente y de su santo. Un encargo típico tarda alrededor de un mes; se coordina por WhatsApp antes de cualquier pago.",
  },
  {
    q: "¿Reparan joyas en Miami?",
    a: "Sí, el taller ofrece reparación de joyas: puedes llevar tu pieza a la tienda o escribir por WhatsApp con fotos para recibir un estimado antes de decidir.",
  },
  {
    q: "¿Hacen envíos fuera de Miami?",
    a: "Sí. Puedes recoger en la tienda (también curbside) o recibir tu pedido con envío a todo Estados Unidos. El pedido se coordina contigo por WhatsApp o directo en la tienda online.",
  },
];

export default async function JoyeriaEnMiamiPage() {
  const all = await getProducts(150);
  // A row of REAL pieces (with live review stars) anchors the guide in the
  // actual catalogue instead of stock photos.
  const featured = await attachRatings(
    all.filter((p) => Number(p.price.amount) > 1).slice(0, 12),
  );
  const heroImg = featured.find((p) => p.images?.[0]?.url)?.images[0] ?? null;
  const wa = `${SITE.contact.whatsapp}?text=${encodeURIComponent(
    "Hola 👋 Vi su página de joyería en Miami y quiero hacerles una consulta.",
  )}`;

  const faqSchema = faqPageSchema(GUIDE_FAQS);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${siteUrl}/joyeria-en-miami#article`,
    headline: "Joyería en Miami: cómo comprar oro real y dónde encontrarlo",
    description:
      "Guía local para comprar joyería de oro en Miami: quilates, precios reales, piezas por encargo y qué diferencia a un taller artesanal de una vitrina.",
    inLanguage: "es",
    datePublished: "2026-07-15",
    dateModified: "2026-07-15",
    author: { "@type": "Organization", name: SITE.name, url: siteUrl },
    publisher: { "@id": `${siteUrl}/#store` },
    mainEntityOfPage: `${siteUrl}/joyeria-en-miami`,
    about: { "@id": `${siteUrl}/#store` },
  };

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Joyería en Miami", url: "/joyeria-en-miami" },
  ]);

  return (
    <>
      <Breadcrumb
        title="Joyería en Miami"
        crumbs={[{ label: "Joyería en Miami" }]}
        bgImage={heroImg?.url}
        titleAs="p"
      />
      <JsonLd data={articleSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />

      <section className="pyj-may">
        <div className="container">
          <div className="pyj-may_hero">
            <div className="pyj-may_hero-text">
              <span className="pyj-kicker">Guía local · Miami, FL</span>
              <h1>
                Joyería en Miami:
                <br />
                oro real, hecho a mano
              </h1>
              {/* Síntesis — self-contained answer block sized for AI citation. */}
              <p className="pyj-may_lede">
                <strong>Pedro Yoruba Jewelry</strong> es un taller-joyería en el
                oeste de Miami ({SITE.contact.address}, zona de Tamiami junto a
                Westchester) donde cada pieza de <strong>oro 10k, 14k y 18k</strong>{" "}
                se fabrica a mano en el mismo lugar donde se vende. Somos la
                joyería de referencia de la comunidad Yoruba / Lucumí del sur de
                la Florida: Idde de Orula, elekes, coronas y herramientas de
                santo, además de anillos, esclavas y cadenas por encargo. Todas
                las piezas tienen <strong>garantía de por vida</strong>, se puede
                recoger en tienda o recibir con envío a todo Estados Unidos, y
                los encargos se coordinan por WhatsApp antes de pagar.
              </p>
              <div className="pyj-may_cta">
                <a className="pyj-btn-gold" href={wa} target="_blank" rel="noreferrer">
                  Escríbenos por WhatsApp
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
                  src={`${heroImg.url}${heroImg.url.includes("?") ? "&" : "?"}width=800`}
                  alt={heroImg.altText || "Joyería de oro hecha a mano en Miami"}
                />
              ) : (
                <div className="pyj-may_hero-fallback" aria-hidden="true">
                  ✦
                </div>
              )}
              <span className="pyj-may_tag">Hecho en Miami</span>
            </div>
          </div>
        </div>
      </section>

      <section className="pyj-may_intro">
        <div className="container">
          <div className="pyj-may_grid">
            <div>
              <h2>1. ¿Cómo reconocer una buena joyería en Miami?</h2>
              <p>
                En Miami hay cientos de vitrinas de joyería, pero muy pocos{" "}
                <strong>talleres que fabrican lo que venden</strong>. La
                diferencia importa: un taller controla el quilate, el peso y la
                terminación de cada pieza, puede hacerla a tu medida y responde
                por ella después de la venta. Antes de comprar, fíjate en tres
                cosas: que la pieza tenga su <strong>sello de quilate</strong>{" "}
                (10k, 14k o 18k), que te digan el <strong>peso en gramos</strong>{" "}
                — el precio del oro real se calcula por peso y pureza, no "por
                pieza bonita" — y que exista una <strong>garantía</strong> real.
                En nuestro taller la garantía es de por vida: si tu pieza
                necesita ajuste o reparación, la trabajamos nosotros mismos.
              </p>
              <h2>2. Oro 10k, 14k o 18k: ¿cuál te conviene?</h2>
              <p>
                El <strong>oro 10k</strong> (41.7% de oro) es el más duro y el
                más accesible: perfecto para piezas de uso diario como un Idde,
                una esclava o un anillo de trabajo. El <strong>14k</strong>{" "}
                (58.5%) equilibra pureza, color y resistencia — el punto medio
                que más se encarga. El <strong>18k</strong> (75%) tiene el color
                más intenso y el mayor valor de metal, pero es más suave y
                costoso. Cualquier pieza del catálogo se puede encargar en el
                quilate que prefieras; lee nuestra{" "}
                <Link href="/blog/oro-10k-14k-18k-cual-elegir">
                  guía completa de quilates
                </Link>{" "}
                para decidir con calma.
              </p>
            </div>
            <div>
              <h2>3. ¿Dónde estamos y cómo comprar?</h2>
              <p>
                Estamos en <strong>{SITE.contact.address}</strong>, en el oeste
                de Miami — la zona de <strong>Tamiami</strong>, junto a
                Westchester y a minutos de Sweetwater, Kendall y la Calle 8.
                Atendemos <strong>lunes a viernes de 10:00 a 5:00</strong> y{" "}
                <strong>sábados de 10:00 a 4:00</strong> (domingos cerrado). Te
                recomendamos <strong>agendar una cita</strong> por WhatsApp para
                atenderte mejor. Puedes comprar en la tienda física, recoger tu pedido
                (también curbside) o recibirlo con <strong>envío a todo
                Estados Unidos</strong>. Aceptamos tarjetas, Zelle, Cash App y
                efectivo.
              </p>
              <h2>4. Nuestra especialidad: joyería religiosa yoruba</h2>
              <p>
                Lo que nos hace únicos entre las joyerías de Miami es el oficio
                religioso: fabricamos las piezas de la tradición{" "}
                <strong>Yoruba / Lucumí (Santería e Ifá)</strong> que una joyería
                comercial no sabe hacer. <Link href="/blog/que-es-el-idde-de-orula">
                Idde de Orula</Link> en oro y plata,{" "}
                <Link href="/blog/colores-de-los-orishas-y-sus-elekes">
                  elekes con los colores de cada Orisha
                </Link>
                , <Link href="/blog/herramientas-de-santo-que-son">
                herramientas de santo</Link>, coronas y piezas de fundamento para
                Ocha e Ifá — todas por encargo, a la medida del cliente y de su
                santo. También surtimos{" "}
                <Link href="/mayoreo">al por mayor a botánicas</Link> de todo el
                país.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Real prices — the data competitors never publish (and AI engines quote). */}
      <section className="pyj-may_intro">
        <div className="container">
          <h2>5. Precios reales de joyería en Miami (nuestro taller)</h2>
          <p className="pyj-guide_note">
            Precios de piezas en catálogo al 15 de julio de 2026 — "desde", según
            modelo, peso y quilate. Los encargos personalizados se cotizan por
            gramo.
          </p>
          <div className="pyj-guide_tablewrap">
            <table className="pyj-guide_table">
              <thead>
                <tr>
                  <th>Pieza</th>
                  <th>Material</th>
                  <th>Precio desde</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Herramientas de santo (juego)</td>
                  <td>Acero inoxidable · garantía de por vida</td>
                  <td>$60</td>
                </tr>
                <tr>
                  <td>Azabache (protección)</td>
                  <td>Azabache + oro</td>
                  <td>$60</td>
                </tr>
                <tr>
                  <td>Idde de plata</td>
                  <td>Plata</td>
                  <td>$370</td>
                </tr>
                <tr>
                  <td>Anillo de Ifá</td>
                  <td>Oro / plata con oro</td>
                  <td>$700</td>
                </tr>
                <tr>
                  <td>Herramientas de Orisha</td>
                  <td>Plata / oro por encargo</td>
                  <td>$750</td>
                </tr>
                <tr>
                  <td>Idde de Orula</td>
                  <td>Oro 10k macizo</td>
                  <td>$4,800</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Explora el <Link href="/shop-left-sidebar">catálogo completo</Link>{" "}
            con precios visibles en cada pieza, o pide una cotización por{" "}
            <a href={wa} target="_blank" rel="noreferrer">
              WhatsApp
            </a>{" "}
            si buscas algo a tu medida.
          </p>
        </div>
      </section>

      {/* Real pieces from the live catalogue */}
      <section className="pyj-may_intro">
        <div className="container">
          <h2>Piezas hechas a mano en nuestro taller de Miami</h2>
          <ProductSlider products={featured} />
        </div>
      </section>

      {/* FAQ — visible text mirrors the FAQPage schema exactly. */}
      <section className="pyj-may_intro">
        <div className="container">
          <h2>Preguntas frecuentes sobre joyería en Miami</h2>
          {GUIDE_FAQS.map((f) => (
            <div className="pyj-guide_qa" key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
          <p className="pyj-guide_meta">
            Escrito por el taller de {SITE.name} · Actualizado: 15 de julio de
            2026 · <Link href="/faq">Más preguntas frecuentes</Link> ·{" "}
            <Link href="/contact">Contacto y mapa</Link>
          </p>
        </div>
      </section>
    </>
  );
}
