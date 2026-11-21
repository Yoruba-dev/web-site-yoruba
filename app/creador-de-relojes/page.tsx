import type { Metadata } from "next";
import "./reloj.css";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import WatchCreator, { type CreatorInitial } from "@/components/watch/WatchCreator";
import WatchGuide from "@/components/watch/WatchGuide";
import type { WatchProductVM } from "@/components/watch/order";
import { breadcrumbSchema } from "@/lib/schema";
import { getProductByHandle } from "@/lib/products";
import { isWatchConfigurable } from "@/lib/commerce";
import { SECCION_RELOJES } from "@/lib/site";
import { WATCH_PRICE_TBD, decodeWatchDesign, isPresetId, resolvePreset, DEFAULT_WATCH } from "@/lib/watch";

// ---------------------------------------------------------------------------
// /creador-de-relojes — RUTA BLOQUEADA PARA SIEMPRE (la enlazan la portada, la
// ficha de producto, WhatsApp y los pedidos: no hay capa de redirecciones).
//
// Lee ?d= (un diseño completo: se restaura exacto), ?preset= (abre el editor
// con ese Orisha, sin pasar por la entrada) y ?reloj= (el producto de Shopify
// cuando exista; hoy no hay ninguno y todo funciona sin él).
//
// Es una herramienta a pantalla completa (ruta de enfoque): en lugar del banner
// grande de Breadcrumb lleva una cabecera fina (migas + h1), y la frase de
// presentación va DEBAJO del creador, para que el reloj que "se arma ante tus
// ojos" quede arriba, a la vista, también en un portátil de 768 px.
// ---------------------------------------------------------------------------

/** Interruptor de lanzamiento: mientras sea false, la página NO se indexa. Es
 *  el MISMO que deja la página fuera del sitemap (SECCION_RELOJES.lanzado en
 *  lib/site.ts), para que el día del lanzamiento baste con cambiar uno. */
const CREATOR_INDEXABLE = SECCION_RELOJES.lanzado;

const OG = "/assets/images/reloj/home/orula-marmol-1024.webp";
const DESCRIPTION =
  "Diseña tu reloj en los colores de tu Orisha: caja octogonal de acero, esfera con la pista de cuentas, tu signo de Ifá grabado al dorso. Ensamblado y personalizado a mano en Miami.";

export const metadata: Metadata = {
  title: { absolute: "Crea tu reloj de Orisha | Pedro Yoruba Jewelry" },
  description: DESCRIPTION,
  alternates: { canonical: "/creador-de-relojes" },
  openGraph: {
    type: "website",
    url: "/creador-de-relojes",
    locale: "es_US",
    title: "Crea tu reloj de Orisha — Pedro Yoruba Jewelry",
    description: DESCRIPTION,
    images: [{ url: OG, width: 1024, height: 1024, alt: "Reloj en los colores de Orula sobre mármol" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crea tu reloj de Orisha — Pedro Yoruba Jewelry",
    description: DESCRIPTION,
    images: [OG],
  },
  robots: {
    index: CREATOR_INDEXABLE,
    follow: true,
    googleBot: { index: CREATOR_INDEXABLE, follow: true },
  },
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function CreadorDeRelojesPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string | string[]; preset?: string | string[]; reloj?: string | string[] }>;
}) {
  const sp = await searchParams;
  const d = first(sp.d);
  const preset = first(sp.preset);
  const reloj = first(sp.reloj);

  // ?d= manda sobre ?preset=: un enlace guardado se abre tal cual.
  const fromLink = d ? decodeWatchDesign(d) : null;
  const initial: CreatorInitial = fromLink
    ? { config: fromLink.config, source: "d", descontinuado: fromLink.descontinuado }
    : isPresetId(preset)
      ? { config: resolvePreset(preset), source: "preset", descontinuado: [] }
      : { config: DEFAULT_WATCH, source: null, descontinuado: [] };

  // El producto de Shopify, solo si lo piden y está etiquetado para el creador.
  const p = reloj ? await getProductByHandle(reloj) : null;
  const product: WatchProductVM | null =
    p && isWatchConfigurable(p)
      ? {
          handle: p.handle,
          title: p.title,
          image: p.images[0]?.url ?? "",
          tags: p.tags,
          variants: p.variants.map((v) => ({
            id: v.id,
            availableForSale: v.availableForSale,
            price: v.price,
            // El fragmento de producto aún no trae las opciones de cada
            // variante: sin ellas variantFor() no elige ninguna y el creador
            // sigue en "precio por confirmar" (WhatsApp). Ver lib/watch.ts.
            ...("selectedOptions" in v && Array.isArray(v.selectedOptions)
              ? { selectedOptions: v.selectedOptions as { name: string; value: string }[] }
              : {}),
          })),
        }
      : null;

  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Crea tu reloj de Orisha", url: "/creador-de-relojes" },
  ]);

  return (
    <>
      <section className="pyj-reloj-page">
        <div className="container">
          <header className="pyj-reloj_top">
            <nav className="pyj-reloj_crumbs" aria-label="Ruta de navegación">
              <ol>
                <li>
                  <Link href="/">Inicio</Link>
                </li>
                <li aria-current="page">Creador de relojes</li>
              </ol>
            </nav>
            <h1 className="pyj-reloj_h1">Crea tu reloj de Orisha</h1>
          </header>

          <WatchCreator initial={initial} product={product} />

          <div className="pyj-cfg-intro pyj-reloj_intro">
            <p className="pyj-cfg-intro_lead">
              {product ? (
                <>
                  Diseña tu <strong>{product.title}</strong>: caja, esfera, correa y tu signo al dorso.
                </>
              ) : (
                <>
                  Tu reloj en los <strong>colores de tu Orisha</strong>, con tu <strong>signo de Ifá</strong> grabado
                  al dorso. Se arma ante tus ojos; {WATCH_PRICE_TBD.toLowerCase()} con tu diseño.
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      <WatchGuide />

      <JsonLd data={breadcrumbLd} />
    </>
  );
}
