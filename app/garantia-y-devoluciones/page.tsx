import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/layout/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import { SITE, SITE_URL as siteUrl, OG_IMAGE } from "@/lib/site";
import { breadcrumbSchema as buildBreadcrumbSchema, faqPageSchema } from "@/lib/schema";

const UPDATED = "15 de julio de 2026";

export const metadata: Metadata = {
  title: "Garantía, devoluciones y reparaciones",
  description:
    "Nuestras políticas: todas las ventas son finales (no devoluciones), garantía de por vida contra defectos, servicio de reparación y compra de oro usado como material. Joyería en Miami.",
  alternates: { canonical: "/garantia-y-devoluciones" },
  keywords: [
    "política de devoluciones joyería",
    "garantía de joyería en Miami",
    "garantía de por vida joyería",
    "reparación de joyas en Miami",
    "todas las ventas son finales",
    "compramos oro usado Miami",
  ],
  openGraph: {
    type: "article",
    images: OG_IMAGE,
    title: "Garantía, devoluciones y reparaciones — Pedro Yoruba Jewelry",
    description:
      "Ventas finales, garantía de por vida contra defectos de fabricación, reparaciones y compra de oro usado como material. Todo explicado con transparencia.",
    url: `${siteUrl}/garantia-y-devoluciones`,
    locale: "es_US",
  },
};

// Policy-specific FAQ — one array feeds BOTH the FAQPage schema and the visible
// Q&A below, so the two can never drift out of sync.
const POLICY_FAQS = [
  {
    q: "¿Puedo devolver o cambiar una joya después de comprarla?",
    a: "No. Todas las ventas son finales: no aceptamos devoluciones, reembolsos, crédito ni cambios. La joyería de oro y plata está en contacto directo con la piel y, además, muchas de nuestras piezas son religiosas, ceremoniales o hechas por encargo, así que no pueden revenderse como nuevas. Esta política se te informa antes de comprar y la aceptas al completar tu pedido.",
  },
  {
    q: "¿Qué cubre la garantía de por vida y qué queda excluido?",
    a: "La garantía de por vida cubre defectos de fabricación —fallas de mano de obra o de material, como una soldadura o un engaste que ceden por defecto de origen— mientras tú, el comprador original, conserves la pieza y su comprobante de compra. NO cubre el desgaste normal por uso (rayones, cadenas o broches gastados), golpes, mal uso, daño por químicos (cloro, perfumes, cremas), pérdida de piedras ni trabajos hechos por otro joyero.",
  },
  {
    q: "¿Cómo solicito una reparación y cuánto tarda?",
    a: `Escríbenos por WhatsApp al ${SITE.contact.phone} con fotos de la pieza, o tráela a la tienda en ${SITE.contact.address}. La revisamos, te damos un presupuesto por escrito antes de trabajar y, con tu aprobación, la reparamos. El tiempo depende del trabajo; te lo confirmamos al cotizar.`,
  },
  {
    q: "¿La reparación tiene costo o es gratis con la garantía?",
    a: "Si es un defecto de fabricación cubierto por la garantía, la reparación del defecto es gratis (tú solo cubres el envío si aplica). El desgaste normal, el daño accidental, los ajustes por tu petición (cambio de medida, pulido, baño de rodio) y el mantenimiento estético tienen costo, siempre cotizado y aprobado por ti antes de trabajar.",
  },
  {
    q: "Vendí una joya y me pagan como oro, no como pieza. ¿Por qué?",
    a: "Compramos oro y plata usados como material para fundir y fabricar piezas nuevas, no para revenderlos como joya de segunda mano. Por eso pagamos por el peso y la pureza (quilates) del metal al precio del día, menos el costo de refinarlo — no el precio de una pieza nueva, que incluye diseño, mano de obra y margen que no se recuperan al fundir. Las piedras y gemas se valoran o se te devuelven aparte; no se funden.",
  },
  {
    q: "¿Qué pasa si mi pieza llega dañada o me entregan la equivocada?",
    a: "Eso no es una devolución por arrepentimiento: es un error nuestro y lo resolvemos. Si tu pieza llega dañada en el envío o recibes algo distinto a lo que pediste, escríbenos de inmediato por WhatsApp con fotos y lo corregimos.",
  },
];

export default function GarantiaDevolucionesPage() {
  const wa = `${SITE.contact.whatsapp}?text=${encodeURIComponent(
    "Hola 👋 Tengo una consulta sobre garantía / reparación de una pieza.",
  )}`;

  const faqSchema = faqPageSchema(POLICY_FAQS);

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${siteUrl}/garantia-y-devoluciones#page`,
    name: "Garantía, devoluciones y reparaciones",
    description:
      "Políticas de Pedro Yoruba Jewelry: ventas finales, garantía de por vida contra defectos, reparaciones y compra de oro usado como material.",
    url: `${siteUrl}/garantia-y-devoluciones`,
    inLanguage: "es",
    dateModified: "2026-07-15",
    about: { "@id": `${siteUrl}/#store` },
    publisher: { "@id": `${siteUrl}/#store` },
  };

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Garantía y devoluciones", url: "/garantia-y-devoluciones" },
  ]);

  return (
    <>
      <Breadcrumb
        title="Garantía y devoluciones"
        crumbs={[{ label: "Garantía y devoluciones" }]}
        titleAs="p"
      />
      <JsonLd data={pageSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />

      <section className="pyj-may">
        <div className="container">
          <div className="pyj-policy_intro">
            <span className="pyj-kicker">Políticas · Actualizado {UPDATED}</span>
            <h1>Garantía, devoluciones y reparaciones</h1>
            <p className="pyj-may_lede">
              En <strong>Pedro Yoruba Jewelry</strong> queremos que compres con
              total claridad. Estas son nuestras tres reglas, en corto:
            </p>
            <ul className="pyj-policy_pillars">
              <li>
                <strong>Todas las ventas son finales.</strong> No aceptamos
                devoluciones, reembolsos ni cambios.
              </li>
              <li>
                <strong>Garantía de por vida</strong> contra defectos de
                fabricación.
              </li>
              <li>
                <strong>Reparación y mantenimiento</strong> de tus piezas, en
                nuestro propio taller.
              </li>
            </ul>
            <p className="pyj-policy_accept">
              Al completar tu compra aceptas estas políticas, que también se
              exhiben en nuestra tienda de Miami.
            </p>
          </div>
        </div>
      </section>

      <section className="pyj-may_intro">
        <div className="container pyj-policy_body">
          <h2 id="devoluciones">
            1. Devoluciones y cambios: todas las ventas son finales
          </h2>
          <p className="pyj-policy_strong">
            TODAS LAS VENTAS SON FINALES. NO ACEPTAMOS DEVOLUCIONES, REEMBOLSOS
            EN EFECTIVO, CRÉDITO EN TIENDA NI CAMBIOS.
          </p>
          <p>
            La razón es honesta: nuestras joyas de oro y plata van en contacto
            directo con la piel y muchas son <strong>piezas religiosas,
            ceremoniales o hechas por encargo</strong> a la medida de cada
            cliente y de su santo. Por higiene, y para no engañar a nadie
            vendiendo como nueva una pieza que ya se usó, no podemos reingresar
            una joya al inventario una vez que sale de la tienda. Por eso te
            informamos esta política <strong>antes</strong> de comprar, la
            exhibimos en la tienda física y la aceptas al pagar.
          </p>
          <p>
            Esto <strong>no</strong> aplica a un error nuestro: si recibes una
            pieza equivocada o llega dañada en el envío, escríbenos de inmediato
            por WhatsApp y lo resolvemos. Un defecto de fabricación se atiende
            por la garantía —no por devolución— como explicamos abajo.
          </p>

          <h2 id="garantia">2. Garantía de por vida contra defectos</h2>
          <p>
            Respaldamos nuestro trabajo con <strong>garantía de por vida contra
            defectos de fabricación</strong>. Cubre las fallas de origen —de
            mano de obra o de material, como una soldadura o un engaste que ceden
            por defecto, no por el uso— durante toda la vida de la pieza,
            mientras tú, el comprador original, la conserves y presentes tu{" "}
            <strong>comprobante de compra</strong>. La reparación del defecto es
            gratuita. Si una pieza resulta irreparable, la reemplazamos por otra
            de valor igual o similar (no hay reembolso en efectivo, en
            coherencia con la política de ventas finales).
          </p>
          <p className="pyj-policy_note">
            Importante: para mantener la garantía, la pieza debe haber sido
            trabajada únicamente por nuestro taller. Cualquier reparación,
            ajuste, soldadura o pulido hecho por otro joyero anula la garantía.
          </p>

          <h2 id="exclusiones">3. Qué NO cubre la garantía</h2>
          <p>
            La garantía protege contra defectos de fabricación, no contra el uso.
            No cubre:
          </p>
          <ul className="pyj-policy_list">
            <li>Desgaste normal: rayones, adelgazamiento del metal, cadenas o broches gastados con el tiempo.</li>
            <li>Golpes, deformaciones, mal uso o accidentes.</li>
            <li>Piedras flojas, caídas o perdidas por el uso, y la pérdida total de la pieza.</li>
            <li>Daño por químicos: cloro de piscina, agua salada, perfumes, cremas, maquillaje o productos de limpieza.</li>
            <li>Desgaste del baño de rodio en el oro blanco (es un acabado que se renueva con mantenimiento).</li>
            <li>Trabajos realizados por terceros y piezas alteradas fuera de nuestro taller.</li>
          </ul>

          <h2 id="reparaciones">4. Reparación y mantenimiento</h2>
          <p>
            Tenemos taller propio y reparamos tanto lo nuestro como piezas de
            otras joyerías: cambio de medida (resize), soldadura de cadenas,
            reengaste de piedras, pulido, baño de rodio, limpieza profesional y
            restauración. El flujo es simple: nos escribes o traes la pieza, la
            diagnosticamos, te damos un{" "}
            <strong>presupuesto por escrito antes de trabajar</strong> y, con tu
            aprobación, la reparamos. Lo que es defecto de fabricación va sin
            costo por la garantía; el desgaste, el daño accidental y los ajustes
            que pidas tienen costo, siempre cotizado y aceptado por ti primero.
          </p>
          <p>
            <a className="pyj-btn-gold" href={wa} target="_blank" rel="noreferrer">
              Solicita una reparación por WhatsApp
            </a>
          </p>

          <h2 id="cuidado">5. Cómo cuidar tus joyas</h2>
          <p>
            El mejor mantenimiento es la prevención. Estos cuidados alargan la
            vida de tu pieza y evitan justamente los daños que la garantía no
            cubre:
          </p>
          <ul className="pyj-policy_list">
            <li>Quítate las joyas antes de nadar, hacer ejercicio, limpiar o dormir.</li>
            <li>Evita el contacto con perfumes, cremas, cloro y productos de limpieza; ponte la joya de última.</li>
            <li>Guarda cada pieza por separado, en tela suave, para que no se rayen entre sí.</li>
            <li>Límpiala con un paño suave y, si hace falta, agua tibia con jabón neutro.</li>
            <li>Tráela de vez en cuando para una revisión y limpieza profesional.</li>
          </ul>

          <h2 id="compra-oro">6. Compra de oro usado (como material)</h2>
          <p>
            También compramos oro y plata que ya no quieras — pero es importante
            entender <strong>cómo</strong>. Nosotros compramos metal como{" "}
            <strong>materia prima para fundir y fabricar piezas nuevas</strong>,
            no para revender joya de segunda mano. Cuando una prenda sale de la
            tienda y regresa, por higiene y para no venderla como nueva a otro
            cliente ya no puede volver al mostrador; además, al usarse o ajustarse
            pierde su condición de fábrica, su garantía y su certificado. Por eso
            la valoramos por lo único con valor recuperable: el oro que la
            compone.
          </p>
          <p>
            El precio se calcula por el <strong>peso y la pureza (quilates)</strong>{" "}
            del metal al precio del oro del día, menos el costo de refinarlo —
            porque para reutilizarlo hay que fundirlo y purificarlo. No es el
            precio de una pieza nueva (ese incluía diseño, mano de obra y margen
            de tienda) ni lo que pagaste originalmente. No es un rechazo a tu joya
            ni a su valor sentimental: es el valor real del metal, calculado con
            transparencia.
          </p>
          <p className="pyj-policy_note">
            Cómo funciona: pesamos y verificamos la pureza real de la pieza
            (ensayo) delante de ti, te damos la cotización y, si la aceptas, la
            compra es final. <strong>Las piedras y gemas se valoran o se te
            devuelven aparte — no se funden.</strong> Por ley de Florida
            necesitamos tu <strong>identificación oficial vigente</strong> para
            comprar metal usado. Los precios dependen del precio del oro del día
            y pueden cambiar.
          </p>

          <h2 id="contacto">¿Dudas? Contáctanos</h2>
          <p>
            Con gusto atendemos garantías y reparaciones. Estamos en{" "}
            <strong>{SITE.contact.address}</strong> · WhatsApp y teléfono{" "}
            <a href={`tel:${SITE.contact.phoneTel}`}>{SITE.contact.phone}</a> ·{" "}
            <Link href="/contact">cómo llegar y horario</Link>. Recuerda traer tu
            comprobante de compra para cualquier reclamo de garantía.
          </p>
        </div>
      </section>

      <section className="pyj-may_intro">
        <div className="container">
          <h2>Preguntas frecuentes sobre garantía y devoluciones</h2>
          {POLICY_FAQS.map((f) => (
            <div className="pyj-guide_qa" key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
          <p className="pyj-guide_meta">
            {SITE.name} · Políticas actualizadas: {UPDATED} ·{" "}
            <Link href="/faq">Más preguntas frecuentes</Link>
          </p>
        </div>
      </section>
    </>
  );
}
