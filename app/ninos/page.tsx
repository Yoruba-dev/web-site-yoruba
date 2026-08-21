import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import ProductCard from "@/components/product/ProductCard";
import SectionTitle from "@/components/ui/SectionTitle";
import CategoryRail from "@/components/shop/CategoryRail";
import { getKidsProducts } from "@/lib/products";
import { attachRatings } from "@/lib/product-ratings";
import { groupKidsByType, typeSlug } from "@/lib/kids";
import { SITE, OG_IMAGE } from "@/lib/site";
import { breadcrumbSchema, collectionPageSchema, itemListSchema } from "@/lib/schema";

// /ninos — el apartado de niños.
//
// Se construye SOLO desde Shopify: las piezas son las etiquetadas `ninos` y las
// subcategorías salen de su `productType` (ver lib/kids.ts). No hay listas de
// productos ni de categorías en el código, así que el dueño añade una pieza a
// esta sección escribiendo una etiqueta, y si es de un tipo nuevo la
// subcategoría aparece sola.
//
// Rendimiento: una sola lectura del catálogo, y esa lectura ya está cacheada y
// compartida con el resto de la web (getProducts). El filtro por subcategoría
// es un parámetro de URL resuelto en el servidor — sin JavaScript de cliente ni
// una segunda petición.

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Joyería para niños: azabaches y protección para bebés",
  description:
    "Azabaches, ojos de Santa Lucía y piezas de protección para bebés y niños, hechos a mano en nuestro taller de Miami. Oro, plata y azabache auténtico.",
  keywords: [
    "azabache para bebe",
    "azabache para niño",
    "joyería para niños miami",
    "ojos de santa lucia",
    "protección mal de ojo bebé",
    "pulsera de azabache bebé",
  ],
  alternates: { canonical: "/ninos" },
  openGraph: {
    type: "website",
    images: OG_IMAGE,
    title: `Joyería para niños — ${SITE.name}`,
    description:
      "Azabaches y piezas de protección para bebés y niños, hechos a mano en Miami.",
    url: "/ninos",
    locale: "es_US",
  },
};

export default async function NinosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const todos = await getKidsProducts();
  const grupos = groupKidsByType(todos);

  // El filtro llega por slug; si no casa con ninguna subcategoría se ignora y
  // se enseña todo, en vez de dejar la página vacía.
  const activo = grupos.find((g) => typeSlug(g.type) === tipo);
  const visibles = await attachRatings(activo ? activo.products : todos);

  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Niños", url: "/ninos" },
  ]);

  return (
    <>
      <Breadcrumb title="Niños" crumbs={[{ label: "Niños" }]} titleAs="p" />
      <JsonLd data={breadcrumbLd} />
      {visibles.length > 0 && (
        <>
          <JsonLd
            data={collectionPageSchema({
              handle: "ninos",
              name: "Joyería para niños",
              description:
                "Azabaches, ojos de Santa Lucía y piezas de protección para bebés y niños, hechos a mano en Miami.",
            })}
          />
          <JsonLd
            data={itemListSchema({
              handle: "ninos",
              items: visibles.slice(0, 24).map((p) => ({
                handle: p.handle,
                title: p.title,
                image: p.images[0]?.url,
              })),
            })}
          />
        </>
      )}

      <section className="pyj-may_intro">
        <div className="container">
          <div className="pyj-may_grid">
            <div>
              <span className="pyj-kicker">Para los más pequeños</span>
              <h1 className="pyj-serv_h1">Joyería para niños</h1>
              <p>
                El <strong>azabache</strong> es lo primero que se le pone a un
                recién nacido en nuestra tradición: se lleva contra el mal de
                ojo, prendido en la ropa, en la muñeca o al cuello. Aquí están
                todas las piezas del taller pensadas para bebés y niños —
                azabache auténtico, ojos de Santa Lucía y montaduras en oro y
                plata, hechas a mano en Miami.
              </p>
              <p>
                ¿Buscas algo que no ves?{" "}
                <a href={SITE.contact.whatsapp} target="_blank" rel="noreferrer">
                  Escríbenos por WhatsApp
                </a>{" "}
                y lo hacemos a la medida del niño.
              </p>
            </div>
            <ul className="pyj-may_points">
              <li>
                <strong>Azabache auténtico</strong>
                La piedra de siempre para la protección del recién nacido.
              </li>
              <li>
                <strong>Montado en oro o plata</strong>
                Para prender en la ropa, en pulso o en cadena.
              </li>
              <li>
                <strong>A la medida</strong>
                Ajustamos el largo al bebé o al niño — dinos la medida.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Subcategorías — salen del tipo de cada pieza, no de una lista fija, y
          se pintan con el MISMO componente que la fila de la tienda. Antes esto
          era ese markup copiado a mano, con el estado activo roto de paso. */}
      {grupos.length > 1 && (
        <CategoryRail
          title="Por tipo de pieza"
          countStyle="short"
          items={[
            {
              href: "/ninos",
              label: "Todo",
              image: todos.find((p) => p.images[0]?.url)?.images[0]?.url,
              count: todos.length,
              active: !activo,
            },
            ...grupos.map((g) => ({
              href: `/ninos?tipo=${typeSlug(g.type)}`,
              label: g.type,
              image: g.image,
              count: g.products.length,
              active: activo?.type === g.type,
            })),
          ]}
        />
      )}

      <section className="hiraola-product_area section-space_add">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <SectionTitle
                title={activo ? activo.type : "Todas las piezas para niños"}
                subtitle={`${visibles.length} ${visibles.length === 1 ? "pieza" : "piezas"}`}
                action={activo ? { label: "Ver todas", href: "/ninos" } : undefined}
              />
            </div>
          </div>

          {visibles.length === 0 ? (
            <p className="pyj-guide_note">
              Todavía no hay piezas publicadas en esta sección.{" "}
              <a href={SITE.contact.whatsapp} target="_blank" rel="noreferrer">
                Escríbenos por WhatsApp
              </a>{" "}
              y te decimos qué tenemos para el niño.
            </p>
          ) : (
            // Las clases del sistema, no un `row` pelado: `shop-product-wrap
            // grid gridview-3` y el `.slide-item` de cada tarjeta son las que
            // traen la separación entre filas. Sin ellas el hueco vertical era
            // literalmente 0 px y las filas se tocaban.
            <div className="shop-product-wrap grid gridview-3 row">
              {visibles.map((p) => (
                <div className="col-6 col-lg-4" key={p.id}>
                  <div className="slide-item">
                    <ProductCard product={p} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
