import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/layout/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import { SITE, SITE_URL as siteUrl, OG_IMAGE } from "@/lib/site";
import { breadcrumbSchema } from "@/lib/schema";

// ---------------------------------------------------------------------------
// Política de privacidad.
//
// Escrita a partir de lo que el sitio HACE de verdad, no de una plantilla: cada
// tercero de la lista se comprobó contra el código (la CSP de next.config.ts,
// lib/judgeme.ts, los archivos de Sentry, app/api/subscribe) y contra la propia
// tienda de Shopify (canales de venta publicados y pasarelas que aparecen en los
// pedidos reales). Si se añade o se quita un servicio, esta lista hay que
// tocarla — es el único sitio donde vive.
//
// La sección de inteligencia artificial no es decorativa: hay más de 50
// imágenes generadas con IA publicadas como fotos de producto en Shopify.
// Enseñarlas sin decirlo puede considerarse publicidad engañosa.
// ---------------------------------------------------------------------------

const ACTUALIZADO = "21 de agosto de 2026";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Qué datos recogemos, con qué terceros se comparten y cómo usamos la inteligencia artificial en nuestras imágenes y textos. Pedro Yoruba Jewelry, Miami.",
  alternates: { canonical: "/privacidad" },
  openGraph: {
    type: "article",
    images: OG_IMAGE,
    title: `Política de privacidad — ${SITE.name}`,
    description:
      "Qué datos recogemos, con quién se comparten y cómo usamos la inteligencia artificial.",
    url: `${siteUrl}/privacidad`,
    locale: "es_US",
  },
};

/** Terceros que reciben datos. Cada uno verificado contra el código o Shopify. */
const TERCEROS = [
  {
    nombre: "Shopify",
    pais: "Canadá / Estados Unidos",
    que: "Toda la tienda: catálogo, carrito, pedidos, datos de contacto y de envío, y la lista de correo.",
    porque: "Es la plataforma sobre la que funciona la tienda y donde se procesa cada compra.",
  },
  {
    nombre: "Shopify Payments, Affirm y Afterpay",
    pais: "Estados Unidos",
    que: "Los datos de pago. La tarjeta se introduce en la pasarela, nunca en esta web.",
    porque: "Para cobrar el pedido y ofrecer pago a plazos.",
  },
  {
    nombre: "Google (Analytics y Merchant Center)",
    pais: "Estados Unidos",
    que: "Páginas visitadas, dispositivo, procedencia y dirección IP aproximada.",
    porque: "Para saber qué se ve en la tienda y publicar el catálogo en Google Shopping.",
  },
  {
    nombre: "Meta (Facebook e Instagram)",
    pais: "Estados Unidos",
    que: "Actividad relacionada con el catálogo publicado en esos canales.",
    porque: "La tienda está conectada a Facebook e Instagram como canal de venta.",
  },
  {
    nombre: "Judge.me",
    pais: "Reino Unido / Estados Unidos",
    que: "Nombre y valoración de quien deja una reseña, y el correo al que se le pide.",
    porque: "Es quien gestiona las reseñas de producto que ves en las fichas.",
  },
  {
    nombre: "Sentry",
    pais: "Estados Unidos",
    que: "Informes técnicos cuando algo falla: navegador, página y dirección IP.",
    porque: "Para enterarnos de los errores y arreglarlos.",
  },
  {
    nombre: "Netlify",
    pais: "Estados Unidos",
    que: "Registros del servidor, incluida la dirección IP.",
    porque: "Es donde está alojada esta web.",
  },
] as const;

export default function PrivacidadPage() {
  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Política de privacidad" },
  ]);

  return (
    <>
      <Breadcrumb
        title="Política de privacidad"
        crumbs={[{ label: "Política de privacidad" }]}
      />
      <JsonLd data={breadcrumbLd} />

      <section className="pyj-may">
        <div className="container">
          <div className="pyj-policy_intro">
            <span className="pyj-kicker">Privacidad · Actualizado {ACTUALIZADO}</span>
            <p className="pyj-may_lede">
              Esta página cuenta, sin rodeos, <strong>qué datos tuyos recogemos</strong>,{" "}
              <strong>con quién se comparten</strong> y{" "}
              <strong>cómo usamos la inteligencia artificial</strong> en las
              imágenes y los textos de la tienda. Está escrita para que se
              entienda, no para protegernos a nosotros.
            </p>
          </div>
        </div>
      </section>

      <section className="pyj-may_intro">
        <div className="container pyj-policy_body">
          <h2>Quiénes somos</h2>
          <p>
            {SITE.name}, joyería artesanal en Miami, Florida. Puedes escribirnos
            a <a href={`mailto:${SITE.contact.email}`}>{SITE.contact.email}</a> o
            por WhatsApp al {SITE.contact.phone} para cualquier cosa relacionada
            con tus datos.
          </p>

          <h2>Qué datos recogemos</h2>
          <ul className="pyj-policy_list">
            <li>
              <strong>Si compras:</strong> nombre, correo, teléfono, dirección de
              envío y de facturación, y el detalle de tu pedido. Los datos de la
              tarjeta <strong>no pasan por esta web</strong> ni los vemos: se
              introducen directamente en la pasarela de pago.
            </li>
            <li>
              <strong>Si te apuntas al boletín:</strong> tu correo electrónico.
            </li>
            <li>
              <strong>Si nos escribes:</strong> lo que nos cuentes y por dónde
              nos lo cuentes.
            </li>
            <li>
              <strong>Si personalizas una pieza</strong> en nuestros
              configuradores: el diseño que compongas, para poder fabricarla.
            </li>
            <li>
              <strong>Solo por navegar:</strong> páginas que visitas, dispositivo,
              navegador, de dónde llegas y tu dirección IP. Esto lo recogen las
              herramientas de medición que enumeramos abajo.
            </li>
          </ul>

          <h2>Con quién se comparten</h2>
          <p>
            No vendemos tus datos a nadie. Los compartimos únicamente con las
            empresas que hacen falta para que la tienda funcione. Esta es la
            lista completa, y qué recibe cada una:
          </p>

          <div className="pyj-guide_tablewrap">
            <table className="pyj-policy_table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Qué recibe</th>
                  <th>Para qué</th>
                </tr>
              </thead>
              <tbody>
                {TERCEROS.map((t) => (
                  <tr key={t.nombre}>
                    <td>
                      <strong>{t.nombre}</strong>
                      <br />
                      <small>{t.pais}</small>
                    </td>
                    <td>{t.que}</td>
                    <td>{t.porque}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="pyj-policy_note">
            Todas estas empresas están fuera de tu control y tienen sus propias
            políticas. Si compras desde fuera de Estados Unidos, ten en cuenta
            que tus datos se procesan allí.
          </p>

          <h2>Cómo usamos la inteligencia artificial</h2>
          <p className="pyj-policy_strong">
            Usamos inteligencia artificial en esta tienda, y creemos que tienes
            derecho a saberlo antes de comprar.
          </p>

          <ul className="pyj-policy_list">
            <li>
              <strong>Imágenes generadas con IA.</strong> Una parte de las fotos
              de producto son <strong>renders creados con inteligencia
              artificial</strong>, no fotografías de la pieza física. Sirven para
              enseñar el diseño, el acabado y las proporciones. Como cada pieza
              se hace a mano, <strong>la que recibas puede tener pequeñas
              diferencias</strong> respecto a la imagen. Si quieres ver fotos
              reales de una pieza concreta antes de comprarla,{" "}
              <a href={SITE.contact.whatsapp} target="_blank" rel="noreferrer">
                pídenoslas por WhatsApp
              </a>{" "}
              y te las mandamos.
            </li>
            <li>
              <strong>Modelos 3D.</strong> Las vistas en 3D y de realidad
              aumentada de algunas piezas se generan con IA a partir de
              fotografías. Son orientativas.
            </li>
            <li>
              <strong>Textos.</strong> Descripciones de producto, artículos del
              Diario y textos de la web se redactan con ayuda de inteligencia
              artificial. <strong>Los datos que importan</strong> —material,
              quilates, medidas, peso y precio— <strong>los pone y los revisa el
              taller</strong>, y son los reales de la pieza.
            </li>
            <li>
              <strong>Tus datos no entrenan modelos.</strong> No entregamos tu
              información personal a sistemas de inteligencia artificial para
              entrenarlos.
            </li>
            <li>
              <strong>Nadie decide por una máquina.</strong> No hay decisiones
              automatizadas sobre ti: ni precios distintos por persona, ni
              perfiles, ni nada que te afecte sin que lo mire alguien del taller.
            </li>
          </ul>

          <h2>Cuánto tiempo guardamos tus datos</h2>
          <p>
            Los pedidos se conservan mientras la ley fiscal lo exija. Tu correo
            en el boletín, hasta que te des de baja — cada envío lleva su enlace.
            Los datos de navegación, el plazo que fije cada herramienta.
          </p>

          <h2>Tus derechos</h2>
          <p>
            Puedes pedirnos <strong>ver</strong> los datos que tenemos de ti,{" "}
            <strong>corregirlos</strong> o <strong>borrarlos</strong>, y{" "}
            <strong>decirnos que no vendamos ni compartamos</strong> tu
            información. Escríbenos a{" "}
            <a href={`mailto:${SITE.contact.email}`}>{SITE.contact.email}</a> y
            te respondemos. No hace falta que expliques por qué.
          </p>

          <h2>Menores</h2>
          <p>
            Esta tienda no está dirigida a menores de 13 años y no recogemos sus
            datos a sabiendas. Las piezas para niños las compra un adulto.
          </p>

          <h2>Cambios</h2>
          <p>
            Si cambiamos algo, actualizamos la fecha de arriba. La versión que
            vale es siempre la que ves aquí.
          </p>

          <p className="pyj-policy_accept">
            ¿Alguna duda? <Link href="/contact">Escríbenos</Link> — preferimos
            explicarlo antes que dejarte con la pregunta.
          </p>
        </div>
      </section>
    </>
  );
}
