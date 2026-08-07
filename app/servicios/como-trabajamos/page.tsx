import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/layout/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import BackLink from "@/components/ui/BackLink";
import { SITE, OG_IMAGE } from "@/lib/site";
import { breadcrumbSchema } from "@/lib/schema";
import { SERVICES } from "@/lib/services";

// /servicios/como-trabajamos — el proceso, de la primera llamada a la pieza
// marcada. Página propia (no un ancla) porque es la que explica CÓMO presta la
// marca sus servicios: se puede entregar su URL sola y se lee completa.
//
// Nota de rutas: este segmento estático convive con [servicio]. Next resuelve
// primero el estático, así que "como-trabajamos" nunca llega al dinámico — y
// por eso no figura en su generateStaticParams.

export const metadata: Metadata = {
  title: "Cómo trabajamos: de la idea a la pieza terminada",
  description:
    "El proceso de un encargo en nuestro taller de Miami: consulta, boceto, render 3D, fundido, acabado a mano, marcado con nuestra marca y entrega. Apruebas en cada etapa.",
  keywords: [
    "proceso joyería personalizada",
    "cómo se hace una joya a medida",
    "render 3d joyería",
    "fundido de joyas miami",
    "taller de joyería miami",
  ],
  alternates: { canonical: "/servicios/como-trabajamos" },
  openGraph: {
    type: "website",
    images: OG_IMAGE,
    title: "Cómo trabajamos — Pedro Yoruba Jewelry",
    description:
      "De la idea a la pieza terminada: consulta, boceto, render 3D, fundido, acabado a mano y marcado con nuestra marca.",
    url: "/servicios/como-trabajamos",
    locale: "es_US",
  },
};

const PASOS = [
  {
    t: "La consulta — nos llamas o nos escribes",
    p: [
      "Atendemos por teléfono, por WhatsApp y en persona en el taller. Nos cuentas qué quieres, para qué es la pieza y para cuándo la necesitas.",
      "Aquí preguntamos lo que hace falta para no equivocarnos: el santo, la talla, si es para uso diario o para una ocasión, y qué presupuesto tienes en mente. De esa conversación sale el encargo — con qué se puede hacer, en qué metal y en qué rango de precio.",
    ],
  },
  {
    t: "De la idea al papel — el boceto",
    p: [
      "Lo que hablamos se dibuja. El boceto fija la forma, las proporciones y las medidas: dónde va cada símbolo, qué ancho lleva el aro, qué tamaño tiene la pieza en milímetros.",
      "Es el primer momento en que ves tu idea fuera de tu cabeza, y el más barato para cambiarla — sobre el papel se corrige con un lápiz.",
    ],
  },
  {
    t: "Del papel al diseño digital y al render 3D",
    p: [
      "El boceto aprobado pasa a diseño gráfico y se modela en 3D. El render te enseña la pieza como se verá en el metal —volúmenes, relieves, cómo cae la luz sobre el grabado— antes de que exista. Aquí se ajusta lo que haga falta y se vuelve a enseñar. Nada avanza a fabricación hasta que el render es el que quieres.",
    ],
  },
  {
    t: "Del render al metal — el fundido",
    p: [
      "Con el diseño aprobado se prepara el modelo y se lleva a molde, y la pieza se funde en el metal que elegiste: oro de 10k, 14k o 18k, plata 925 o acero inoxidable. Sale en bruto, con el peso y la forma definitivos.",
    ],
  },
  {
    t: "Acabado a mano — limado, pulido, engaste y grabado",
    p: [
      "Es la parte que no hace una máquina. Se lima, se pule hasta el brillo final, se montan las piedras una a una y se graba lo que lleve grabado —un nombre, unas iniciales, tu signo de Ifá o el motivo que pediste— con el esquema que aprobaste como plano.",
    ],
  },
  {
    t: "La pieza se marca con nuestra marca",
    p: [
      "Antes de salir del taller, la pieza queda marcada con la marca de la casa. Es lo que la identifica como nuestra años después — y lo que nos permite reconocerla cuando alguien nos la trae a autenticar.",
    ],
  },
  {
    t: "Revisión final y entrega",
    p: [
      "Se revisa contra el diseño aprobado —medidas, acabado, engastes, grabado— y se entrega. La recoges en el taller de Miami o te la enviamos a cualquier parte de Estados Unidos.",
    ],
  },
];

export default function ComoTrabajamosPage() {
  const wa = SITE.contact.whatsapp;
  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Servicios", url: "/servicios" },
    { name: "Cómo trabajamos" },
  ]);

  return (
    <>
      <Breadcrumb
        title="Cómo trabajamos"
        crumbs={[{ label: "Servicios", href: "/servicios" }, { label: "Cómo trabajamos" }]}
        titleAs="p"
      />
      <JsonLd data={breadcrumbLd} />

      <section className="pyj-may_intro">
        <div className="container">
          <span className="pyj-kicker">Cómo trabajamos</span>
          <h1 className="pyj-serv_h1">De la idea a la pieza terminada</h1>
          <p className="pyj-may_lede">
            Un encargo no empieza en una máquina: empieza en una conversación.
            Este es el camino que recorre cada pieza personalizada que sale de{" "}
            <strong>{SITE.name}</strong>, y en cada etapa hay un punto en el que
            tú apruebas antes de seguir adelante.
          </p>

          <ol className="pyj-guide_steps">
            {PASOS.map((s, i) => (
              <li className="pyj-guide_step" key={s.t}>
                <span className="pyj-guide_num">{i + 1}</span>
                <div>
                  <strong className="pyj-guide_steptitle">{s.t}</strong>
                  {s.p.map((t, j) => (
                    <p className="pyj-guide_stepbody" key={j}>
                      {t}
                    </p>
                  ))}
                  {i === 2 && (
                    <p className="pyj-guide_stepbody">
                      Cuando el encargo se arma en{" "}
                      <Link href="/configurador">los configuradores de la web</Link>,
                      este paso lo haces tú: la pieza que compones en pantalla es
                      la pieza real, y tu pedido llega al taller con esa hoja de
                      diseño.
                    </p>
                  )}
                  {i === 5 && (
                    <p className="pyj-guide_stepbody">
                      Es también lo que sostiene el servicio de{" "}
                      <Link href="/servicios/autenticacion">
                        autenticación de joyas
                      </Link>
                      .
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Dónde aparece la marca — el dato que importa para el registro. */}
      <section className="pyj-may_intro">
        <div className="container">
          <div className="pyj-may_grid">
            <div>
              <h2>Nuestra marca va en la pieza, no solo en la caja</h2>
              <p>
                Todo lo que sale de este taller lleva la marca de{" "}
                <strong>{SITE.name}</strong>. No es un adorno: es la firma del
                taller sobre su propio trabajo, y la razón por la que podemos
                responder por una pieza mucho después de venderla.
              </p>
              <p>
                Lo más visible son las <strong>monedas de Ifá</strong>, que
                llevan el sello <strong>PYJ</strong> acuñado en el propio cuño de
                la moneda, junto a las medidas de la pieza (plata 925, 36.5 mm).
                Los encargos hechos en la web viajan además con su{" "}
                <strong>hoja de diseño</strong> a nombre del taller, que deja
                constancia de qué se pidió y cómo se hizo.
              </p>
            </div>
            <ul className="pyj-may_points">
              <li>
                <strong>En la pieza</strong>
                La marca del taller, marcada en el metal antes de la entrega.
              </li>
              <li>
                <strong>En la moneda</strong>
                El sello <strong>PYJ</strong> acuñado en el cuño, junto a los 16
                Odù Meji del anverso.
              </li>
              <li>
                <strong>En el papel</strong>
                Hoja de diseño y pedido a nombre de {SITE.name}, con el esquema
                exacto de lo aprobado.
              </li>
              <li>
                <strong>En la caja</strong>
                Las piezas de presentación se entregan en el estuche de la casa.
              </li>
            </ul>
          </div>

          <div className="pyj-serv_cta">
            <a className="pyj-btn-gold" href={wa} target="_blank" rel="noreferrer">
              Empieza tu encargo por WhatsApp
            </a>
            <a className="pyj-may_phone" href={`tel:${SITE.contact.phoneTel}`}>
              o llama al {SITE.contact.phone}
            </a>
          </div>

          <nav className="pyj-serv_nav" aria-label="Servicios del taller">
            {SERVICES.map((s) => (
              <Link key={s.slug} href={`/servicios/${s.slug}`} className="pyj-serv_navlink">
                <span className="pyj-serv_navdir">Servicio</span>
                <span className="pyj-serv_navname">{s.name}</span>
              </Link>
            ))}
          </nav>
          <BackLink href="/servicios" label="Volver" />
        </div>
      </section>
    </>
  );
}
