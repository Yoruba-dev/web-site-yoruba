import type { Metadata } from "next";
import "./guia.css";
import Link from "next/link";
import Breadcrumb from "@/components/layout/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import WatchGuide from "@/components/watch/WatchGuide";
import GuideResume from "@/components/watch/GuideResume";
import { breadcrumbSchema } from "@/lib/schema";
import { SECCION_RELOJES } from "@/lib/site";
import { WATCH_PRICE_TBD } from "@/lib/watch";

// ---------------------------------------------------------------------------
// /creador-de-relojes/como-funciona — la guía del creador, en su PROPIA página
// (spec V2 §3.10, R4): el editor es solo el editor. Página normal de la web
// (cabecera, pie y barra de pestañas: NO es ruta de enfoque). Mientras el
// creador no se lance, no se indexa; tampoco va en el sitemap hasta entonces.
// ---------------------------------------------------------------------------

const INDEXABLE = SECCION_RELOJES.lanzado;
const RUTA = `${SECCION_RELOJES.ruta}/como-funciona`;

export const metadata: Metadata = {
  title: "Cómo funciona el creador de relojes",
  description:
    "Cómo diseñar tu reloj de Orisha paso a paso: caja, esfera, correa y tu signo grabado al dorso. Precio, plazo de taller y la prueba antes de producir.",
  alternates: { canonical: RUTA },
  robots: {
    index: INDEXABLE,
    follow: true,
    googleBot: { index: INDEXABLE, follow: true },
  },
};

export default function ComoFuncionaPage() {
  const crumbs = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Crea tu reloj de Orisha", url: SECCION_RELOJES.ruta },
    { name: "Cómo funciona", url: RUTA },
  ]);
  return (
    <>
      <Breadcrumb
        title="Cómo funciona"
        crumbs={[{ label: "Creador de relojes", href: SECCION_RELOJES.ruta }, { label: "Cómo funciona" }]}
      />
      <section className="pyj-guia">
        <div className="container">
          <p className="pyj-guia_lead">
            Tu reloj en los <strong>colores de tu Orisha</strong>, con tu <strong>signo de Ifá</strong> grabado al
            dorso. Se arma ante tus ojos; {WATCH_PRICE_TBD.toLowerCase()} con tu diseño.
          </p>
          <div className="pyj-guia_ctas">
            <Link href={SECCION_RELOJES.ruta} className="pyj-btn-gold">
              Empezar a diseñar
            </Link>
            <GuideResume />
          </div>
        </div>
      </section>
      <WatchGuide />
      <section className="pyj-guia pyj-guia--end">
        <div className="container">
          <div className="pyj-guia_ctas">
            <Link href={SECCION_RELOJES.ruta} className="pyj-btn-gold">
              Empezar a diseñar
            </Link>
            <GuideResume />
          </div>
        </div>
      </section>
      <JsonLd data={crumbs} />
    </>
  );
}
