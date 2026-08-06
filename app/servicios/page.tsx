import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/layout/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import { SITE, OG_IMAGE } from "@/lib/site";
import { sizedImageUrl } from "@/lib/utils";
import { breadcrumbSchema, faqPageSchema, serviceSchema } from "@/lib/schema";

// -----------------------------------------------------------------------------
// /servicios — la página que declara los servicios del taller: diseño de joyas,
// grabado, autenticación y consultoría de diseño. Además de su papel comercial
// y de SEO, esta página documenta el uso de la marca en relación con esos
// servicios (el dueño la necesita como respaldo del registro de marca), así que
// TODO lo que se afirma aquí debe ser verificable en el negocio real: los
// configuradores existen, el flujo por encargo existe, el sello PYJ se acuña de
// verdad. Nada de credenciales inventadas — donde el alcance es caso a caso, el
// texto remite a consulta en vez de prometer.
// -----------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Diseño de joyas, grabado y autenticación — servicios del taller",
  description:
    "Servicios de joyería en Miami: diseño de piezas personalizadas en oro 10k, 14k y 18k, grabado de signos de Ifá, verificación de metales y consultoría de diseño. Taller propio en el oeste de Miami — escríbenos por WhatsApp.",
  keywords: [
    "diseño de joyas miami",
    "joyería personalizada miami",
    "jewelry design miami",
    "custom jewelry design",
    "grabado de joyas",
    "jewelry engraving miami",
    "autenticación de joyas",
    "jewelry authentication",
    "consultoría de diseño de joyas",
    "jewelry design consulting",
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

// Un solo arreglo alimenta las anclas de la página, el índice del hero y los
// cuatro Service de JSON-LD — así lo visible y lo estructurado no divergen.
// `en` es el nombre del servicio en inglés: se muestra como subtítulo (público
// bilingüe de Miami) y viaja como alternateName en el schema.
const SERVICES = [
  {
    id: "diseno",
    name: "Diseño de joyas",
    en: "Jewelry design",
    type: "Diseño y fabricación de joyería personalizada",
    summary:
      "Piezas que no existen en catálogo, dibujadas contigo y hechas a mano en oro de 10k, 14k o 18k, plata 925 o acero inoxidable.",
  },
  {
    id: "grabado",
    name: "Grabado de joyas",
    en: "Jewelry engraving",
    type: "Grabado de joyería",
    summary:
      "Los signos de Ifá y otros motivos, grabados sobre anillos y monedas del taller — con el esquema exacto de tu diseño.",
  },
  {
    id: "autenticacion",
    name: "Autenticación de joyas",
    en: "Authenticating jewelry",
    type: "Verificación y autenticación de joyería",
    // Presencial: la pieza se revisa en el mostrador, no por correo.
    areaServed: { type: "City", name: "Miami" },
    summary:
      "Verificación del quilataje del oro y la ley de la plata, revisión de construcción e identificación de piezas de nuestro taller.",
  },
  {
    id: "consultoria",
    name: "Consultoría de diseño",
    en: "Jewelry design consulting service",
    type: "Consultoría de diseño de joyería",
    summary:
      "Te ayudamos a decidir metal, medidas y piedras antes de encargar — y asesoramos a botánicas y tiendas que quieren línea propia.",
  },
];

// FAQ — mismo patrón "definir una vez" que mayoreo y garantía: este arreglo
// pinta el bloque visible Y alimenta el FAQPage de JSON-LD, siempre idénticos.
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

  const serviceLds = SERVICES.map((s) =>
    serviceSchema({
      name: s.name,
      alternateName: s.en,
      serviceType: s.type,
      description: s.summary,
      path: `/servicios#${s.id}`,
      areaServed: s.areaServed,
    }),
  );
  const faqLd = faqPageSchema(FAQS);
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
      <JsonLd data={faqLd} />
      <JsonLd data={breadcrumbLd} />

      {/* Hero editorial — mismo patrón que /mayoreo y /joyeria-en-miami. */}
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
                piezas nuevas, grabamos signos y motivos, verificamos metales y
                te asesoramos antes de que encargues una joya. Todo se hace a
                mano en nuestro taller del oeste de Miami.
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
              {/* Foto real de una pieza de diseño del taller (el banner de
                  "diseño personalizado" lleva texto pintado y aquí saldría
                  cortado). */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sizedImageUrl(
                  "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/2_f0f4ba3a-1240-4c88-89d7-0150dd3337d6.jpg?v=1784323066",
                  800,
                )}
                alt="Anillo Masón personalizado con circonias, diseñado y hecho a mano en el taller de Pedro Yoruba Jewelry"
              />
              <span className="pyj-may_tag">Hecho en Miami</span>
            </div>
          </div>
        </div>
      </section>

      {/* Índice de los cuatro servicios — cada punto ancla a su sección. */}
      <section className="pyj-may_intro">
        <div className="container">
          <div className="pyj-may_grid">
            <div>
              <h2>Un taller, cuatro servicios</h2>
              <p>
                Somos <strong>fabricante, no revendedor</strong>: las piezas se
                diseñan, se funden, se engastan y se graban en nuestro propio
                taller de Miami ({SITE.contact.address}, zona de Tamiami junto a
                Westchester). Eso nos deja ofrecer servicios que una vitrina no
                puede: cambiar un diseño antes de fabricarlo, grabar un signo
                exactamente como lo pediste o decirte con fundamento qué metal
                tiene una pieza.
              </p>
              <p>
                Atendemos en tienda de lunes a sábado y por WhatsApp. Aceptamos Visa, MasterCard, American Express, Discover y
                débito, y enviamos a todo Estados Unidos.
              </p>
            </div>
            <ul className="pyj-may_points">
              {SERVICES.map((s) => (
                <li key={s.id}>
                  <strong>
                    <a href={`#${s.id}`}>{s.name}</a>
                  </strong>
                  {s.summary}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 1 · DISEÑO */}
      <section className="pyj-may_intro" id="diseno">
        <div className="container">
          <div className="pyj-may_grid">
            <div>
              <span className="pyj-kicker">Jewelry design</span>
              <h2>Diseño de joyas personalizadas</h2>
              <p>
                Es el corazón del taller. Nos traes una idea —el Idde a la
                medida de tu santo, una corona, un anillo de sello, un dije que
                viste una vez y nadie te supo hacer— y la convertimos en una
                pieza real: definimos contigo el metal (oro de 10k, 14k o 18k,
                plata 925 o acero inoxidable), las medidas, las piedras y el
                acabado, te confirmamos el precio antes de empezar, y la
                fabricamos a mano.
              </p>
              <p>
                También puedes diseñar tú mismo desde la web:{" "}
                <Link href="/configurador">el configurador de anillos de Ifá</Link>{" "}
                y <Link href="/configurador-monedas">el de monedas</Link> te
                dejan colocar tus signos sobre la pieza real y pagar en línea.
                La orden llega al taller con la hoja de diseño exacta de lo que
                armaste — lo que apruebas es lo que se fabrica.
              </p>
            </div>
            <ul className="pyj-may_points">
              <li>
                <strong>Piezas de la tradición Yoruba / Lucumí</strong>
                Idde de Orula, elekes, herramientas de santo, coronas y
                atributos de cada Oricha, hechos con respeto por la tradición.
              </li>
              <li>
                <strong>Diseño general</strong>
                Anillos de sello, dijes, cadenas y esclavas — el taller no se
                limita a la línea religiosa.
              </li>
              <li>
                <strong>Personalización real</strong>
                Color y piedras según tu santo, el animal que pidas tallado en
                la pieza, tu talla exacta.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 2 · GRABADO */}
      <section className="pyj-may_intro" id="grabado">
        <div className="container">
          <div className="pyj-may_grid">
            <div>
              <span className="pyj-kicker">Jewelry engraving</span>
              <h2>Grabado de joyas</h2>
              <p>
                Grabamos los signos de Ifá —los 16 Odù Meji, con sus torres
                izquierda y derecha tal como se escriben— y otros motivos,
                sobre el oro y la plata que salen del taller. No
                trabajamos de memoria: ningún grabado se talla sin que apruebes
                antes el esquema exacto. Los pedidos hechos en los
                configuradores de la web llegan al taller con esa hoja de
                diseño ya generada.
              </p>
              <p>
                La pieza insignia es la{" "}
                <strong>moneda de Ifá en plata 925</strong>, de 36.5 mm,
                acuñada en el taller: el anverso lleva los 16 Odù Meji de fábrica
                y el reverso queda liso para tu signo — el grabado va incluido
                en el precio. Cada una lleva acuñado el sello{" "}
                <strong>PYJ</strong> del taller.
              </p>
              <p>
                ¿Quieres grabar una pieza que no salió de aquí? Escríbenos
                primero con una foto: el grabado sobre piezas externas se evalúa
                caso a caso, según el metal y el estado de la pieza.
              </p>
            </div>
            <ul className="pyj-may_points">
              <li>
                <strong>Signos de Ifá</strong>
                El Odù completo o una torre, en el frente y los laterales de un
                anillo o en el reverso de la moneda.
              </li>
              <li>
                <strong>Diseño aprobado antes de tallar</strong>
                El esquema que apruebas es el plano que sigue el grabador.
              </li>
              <li>
                <strong>
                  <Link href="/configurador-monedas">Diseña tu moneda →</Link>
                </strong>
                Coloca tu signo sobre la moneda real y págala en la web.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3 · AUTENTICACIÓN */}
      <section className="pyj-may_intro" id="autenticacion">
        <div className="container">
          <div className="pyj-may_grid">
            <div>
              <span className="pyj-kicker">Authenticating jewelry</span>
              <h2>Autenticación de joyas</h2>
              <p>
                Trabajamos el oro y la plata todos los días, y eso nos permite
                decirte con fundamento qué tienes en la mano. Traes la pieza a
                la tienda y la revisamos contigo: verificamos el{" "}
                <strong>quilataje del oro</strong> (10k, 14k, 18k) y la{" "}
                <strong>ley de la plata</strong> (925), y examinamos la
                construcción — soldaduras, engastes, broches, huecos — para
                decirte qué es, cómo está hecha y en qué estado se encuentra.
              </p>
              <p>
                Si la pieza salió de nuestro taller, la identificamos: las
                monedas llevan el sello <strong>PYJ</strong> acuñado y los
                encargos quedan registrados con su pedido, así que podemos
                confirmar si una pieza es nuestra y cómo se hizo.
              </p>
              <p>
                Para ser claros: este servicio no incluye tasaciones para seguros
                ni certificados gemológicos de laboratorio. Si tu caso necesita
                uno, te decimos a quién acudir.
              </p>
            </div>
            <ul className="pyj-may_points">
              <li>
                <strong>Verificación de metal</strong>
                Quilataje del oro y ley de la plata, verificados en el taller.
              </li>
              <li>
                <strong>Revisión de construcción</strong>
                Soldaduras, engastes y broches — qué tiene la pieza y en qué
                estado está.
              </li>
              <li>
                <strong>Piezas del taller</strong>
                Identificación por el sello PYJ y el registro del pedido.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4 · CONSULTORÍA */}
      <section className="pyj-may_intro" id="consultoria">
        <div className="container">
          <div className="pyj-may_grid">
            <div>
              <span className="pyj-kicker">Jewelry design consulting</span>
              <h2>Consultoría de diseño</h2>
              <p>
                Una pieza de oro es una decisión de cientos o miles de dólares,
                y conviene tomarla con alguien que fabrica. Antes de encargar te
                ayudamos a decidir lo que de verdad cambia el resultado: qué
                quilate conviene según el uso y el presupuesto (el 10k, el 14k y
                el 18k no brillan ni pesan ni cuestan igual), qué medidas tomar,
                qué piedras corresponden a tu santo y cómo cuidar la pieza para
                que dure.
              </p>
              <p>
                También asesoramos a <strong>negocios</strong>:{" "}
                <Link href="/mayoreo">botánicas y tiendas religiosas</Link> que
                arman su surtido o quieren una línea propia hecha en nuestro
                taller. La primera conversación —por WhatsApp o en la tienda—
                no cuesta nada.
              </p>
            </div>
            <ul className="pyj-may_points">
              <li>
                <strong>Elegir el metal</strong>
                10k, 14k o 18k según uso, color y presupuesto —{" "}
                <Link href="/blog/oro-10k-14k-18k-cual-elegir">
                  lee nuestra guía de quilates
                </Link>
                .
              </li>
              <li>
                <strong>Piedras según tu santo</strong>
                Los colores y gemas que corresponden a cada Oricha, aplicados a
                tu pieza.
              </li>
              <li>
                <strong>Para tiendas</strong>
                Surtido, reposición y línea propia para botánicas, con precio de
                mayorista.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Cómo se encarga — tres pasos, el mismo flujo real de la tienda. */}
      <section className="pyj-may_intro">
        <div className="container">
          <h2>Cómo funciona un encargo</h2>
          <ol className="pyj-guide_steps">
            <li className="pyj-guide_step">
              <span className="pyj-guide_num">1</span>
              <div>
                <strong className="pyj-guide_steptitle">Nos cuentas la idea</strong>
                <p className="pyj-guide_stepbody">
                  Por WhatsApp, en la tienda o armándola tú mismo en los
                  configuradores de la web.
                </p>
              </div>
            </li>
            <li className="pyj-guide_step">
              <span className="pyj-guide_num">2</span>
              <div>
                <strong className="pyj-guide_steptitle">
                  Confirmamos diseño, metal y precio
                </strong>
                <p className="pyj-guide_stepbody">
                  Nada se fabrica sin que apruebes lo que se va a hacer y lo que
                  cuesta.
                </p>
              </div>
            </li>
            <li className="pyj-guide_step">
              <span className="pyj-guide_num">3</span>
              <div>
                <strong className="pyj-guide_steptitle">La hacemos a mano</strong>
                <p className="pyj-guide_stepbody">
                  La recoges en la tienda o te la enviamos a cualquier parte de
                  Estados Unidos.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* FAQ visible — el mismo arreglo que alimenta el FAQPage de arriba. */}
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
            {SITE.name} · {SITE.contact.address} · Lunes a
            viernes 10am–5pm, sábado 10am–4pm ·{" "}
            <a href={`tel:${SITE.contact.phoneTel}`}>{SITE.contact.phone}</a>
          </p>
        </div>
      </section>
    </>
  );
}
