import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/layout/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import WorkGallery from "@/components/servicios/WorkGallery";
import { SITE, OG_IMAGE } from "@/lib/site";
import { sizedImageUrl } from "@/lib/utils";
import { breadcrumbSchema, faqPageSchema, serviceSchema } from "@/lib/schema";
import { SERVICES, WORKSHOP_PHOTOS } from "@/lib/services";

// -----------------------------------------------------------------------------
// /servicios — ÍNDICE. Presenta el taller y manda a la página de cada servicio.
//
// Cada servicio tiene su propia URL (/servicios/diseno, …) en vez de un ancla:
// así se puede entregar un enlace por servicio, cada uno con su título y su
// nodo Service, que es lo que sirve para documentar el uso de la marca. Los
// datos viven en lib/services.ts; aquí solo se presentan.
//
// Todo lo que se afirma tiene que ser verificable en el negocio real. Donde el
// alcance depende del caso, el texto remite a consulta en vez de prometer.
// -----------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Servicios del taller: diseño, grabado y autenticación de joyas",
  description:
    "Servicios del taller en Miami: diseño de piezas en oro 10k, 14k y 18k, grabado de nombres, iniciales y signos de Ifá, y verificación de metales.",
  keywords: [
    "servicios de joyería miami",
    "diseño de joyas miami",
    "joyería personalizada miami",
    "grabado de joyas",
    "grabado de nombres en joyas",
    "autenticación de joyas",
    "consultoría de diseño de joyas",
    "taller de joyería miami",
  ],
  alternates: { canonical: "/servicios" },
  openGraph: {
    type: "website",
    images: OG_IMAGE,
    title: "Servicios del taller — Pedro Yoruba Jewelry",
    description:
      "Diseño de joyas personalizadas, grabado, autenticación de metales y consultoría de diseño. Taller propio en el oeste de Miami.",
    url: "/servicios",
    locale: "es_US",
  },
};

// FAQ — mismo patrón "definir una vez": este arreglo pinta el bloque visible Y
// alimenta el FAQPage de JSON-LD, así que nunca pueden divergir.
const FAQS = [
  {
    q: "¿Hacen diseños personalizados fuera de la tradición Yoruba?",
    a: "Sí. Además de las piezas de la tradición (Idde, elekes, herramientas de santo), hacemos por encargo anillos de sello, dijes, cadenas y piezas de diseño general en oro y plata.",
  },
  {
    q: "¿Puedo diseñar mi pieza yo mismo desde la web?",
    a: "Sí. El configurador de anillos de Ifá y el de monedas te dejan colocar tu signo sobre la pieza real y pagar en la web; la orden llega al taller con la hoja de diseño exacta de lo que armaste.",
  },
  {
    q: "¿Graban nombres, iniciales o fechas en una joya?",
    a: "Sí. Grabamos nombres, iniciales y fechas —por dentro del aro de un anillo, en la cara de un anillo de sello o en el reverso de un dije—, además de los signos de Ifá y otros motivos. Nos dices el texto exacto, te confirmamos cómo queda y eso es lo que va al metal. Sobre piezas hechas en nuestro taller va coordinado con el encargo; si la joya no salió de aquí, escríbenos con una foto y lo evaluamos caso a caso.",
  },
  {
    q: "¿Qué incluye la autenticación y qué no?",
    a: "Incluye la verificación del metal (quilataje del oro, ley de la plata), la revisión de la construcción de la pieza y la identificación de piezas hechas en nuestro taller. No emitimos tasaciones para seguros ni certificados gemológicos de laboratorio; para eso te decimos a quién acudir.",
  },
  {
    q: "¿Cómo empiezo un encargo o una consulta?",
    a: `Escríbenos por WhatsApp al ${SITE.contact.phone} o visítanos en ${SITE.contact.address}, de lunes a sábado. La primera conversación no cuesta nada: nos cuentas la idea y te decimos qué se puede hacer y en qué rango de precio.`,
  },
];

export default function ServiciosPage() {
  const wa = SITE.contact.whatsapp;

  // Un Service por servicio, apuntando a SU página. Mismos @id que referencia
  // el nodo global de marca en components/layout/StructuredData.tsx.
  const serviceLds = SERVICES.map((s) =>
    serviceSchema({
      name: s.name,
      alternateName: s.en,
      serviceType: s.serviceType,
      description: s.summary,
      path: `/servicios/${s.slug}`,
      areaServed: s.areaServed,
    }),
  );
  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Servicios", url: "/servicios" },
  ]);

  return (
    <>
      <Breadcrumb title="Servicios" crumbs={[{ label: "Servicios" }]} titleAs="p" />
      {serviceLds.map((ld, i) => (
        <JsonLd key={i} data={ld} />
      ))}
      <JsonLd data={faqPageSchema(FAQS)} />
      <JsonLd data={breadcrumbLd} />

      <section className="pyj-may">
        <div className="container">
          <div className="pyj-may_hero">
            <div className="pyj-may_hero-text">
              <span className="pyj-kicker">Taller · Estudio de diseño</span>
              <h1>
                Servicios de diseño
                <br />y taller de joyería
              </h1>
              <p className="pyj-may_lede">
                Además de la joyería que ves en la tienda, en{" "}
                <strong>{SITE.name}</strong> trabajamos por encargo: diseñamos
                piezas nuevas, grabamos nombres, iniciales y signos de Ifá,
                verificamos metales y te asesoramos antes de que encargues una
                joya. Todo se hace a mano en nuestro taller del oeste de Miami.
              </p>
              <div className="pyj-may_cta">
                <a className="pyj-btn-gold" href={wa} target="_blank" rel="noreferrer">
                  Cuéntanos tu idea por WhatsApp
                </a>
                <a className="pyj-may_phone" href={`tel:${SITE.contact.phoneTel}`}>
                  o llama al {SITE.contact.phone}
                </a>
              </div>
            </div>
            <div className="pyj-may_hero-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sizedImageUrl(
                  "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/2_f0f4ba3a-1240-4c88-89d7-0150dd3337d6.jpg?v=1784323066",
                  900,
                )}
                alt="Anillo Masón personalizado con circonias, diseñado y hecho a mano en el taller de Pedro Yoruba Jewelry"
              />
              <span className="pyj-may_tag">Hecho en Miami</span>
            </div>
          </div>
        </div>
      </section>

      {/* Las cuatro tarjetas — cada una entra a su propia página. */}
      <section className="pyj-may_intro">
        <div className="container">
          <h2>Un taller, cuatro servicios</h2>
          <p className="pyj-may_lede">
            Somos <strong>fabricante, no revendedor</strong>: las piezas se
            diseñan, se funden, se engastan y se graban en nuestro propio taller
            de Miami ({SITE.contact.address}). Eso nos deja ofrecer servicios que
            una vitrina no puede.
          </p>

          <ul className="pyj-serv_cards">
            {SERVICES.map((s) => (
              <li key={s.slug} className="pyj-serv_card">
                <Link href={`/servicios/${s.slug}`} className="pyj-serv_cardlink">
                  <span className="pyj-serv_cardimg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sizedImageUrl(s.cover.src, 520)}
                      alt={s.cover.alt}
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                  <span className="pyj-serv_cardbody">
                    <span className="pyj-serv_carden">{s.en}</span>
                    <span className="pyj-serv_cardname">{s.name}</span>
                    <span className="pyj-serv_cardsum">{s.summary}</span>
                    <span className="pyj-serv_cardmore">Ver el servicio →</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="pyj-guide_note">
            ¿Quieres ver cómo va un encargo de principio a fin?{" "}
            <Link href="/servicios/como-trabajamos">
              Mira el proceso completo, paso a paso →
            </Link>
          </p>
        </div>
      </section>

      <section className="pyj-may_intro">
        <div className="container">
          <div className="pyj-work_intro" style={{ marginTop: 0 }}>
            <h2>Trabajos salidos de este taller</h2>
            <p>
              Todas estas piezas se diseñaron y se hicieron aquí, y están en el
              catálogo — toca cualquiera para ver su ficha.
            </p>
          </div>
          <WorkGallery photos={WORKSHOP_PHOTOS} columns={4} />
        </div>
      </section>

      <section className="pyj-may_intro">
        <div className="container">
          <h2>Preguntas frecuentes sobre los servicios</h2>
          {FAQS.map((f) => (
            <div className="pyj-guide_qa" key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
          <p className="pyj-guide_note">
            {SITE.name} · {SITE.contact.address} · Lunes a viernes 10am–5pm,
            sábado 10am–4pm ·{" "}
            <a href={`tel:${SITE.contact.phoneTel}`}>{SITE.contact.phone}</a>
          </p>
        </div>
      </section>
    </>
  );
}
