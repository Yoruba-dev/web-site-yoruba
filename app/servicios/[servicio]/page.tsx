import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/layout/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import ArticleBody from "@/components/blog/ArticleBody";
import WorkGallery from "@/components/servicios/WorkGallery";
import BackLink from "@/components/ui/BackLink";
import { SITE, OG_IMAGE } from "@/lib/site";
import { breadcrumbSchema, serviceSchema } from "@/lib/schema";
import { SERVICES, getService, serviceNeighbours } from "@/lib/services";

// Una página REAL por servicio (/servicios/diseno, /servicios/grabado, …) en
// vez de anclas dentro de una página larga. Cada una tiene su URL, su título,
// su descripción y su propio nodo Service de datos estructurados, de modo que
// se pueda entregar un enlace por servicio — que es lo que hace falta para
// documentar el uso de la marca. Y como son navegaciones de verdad, el
// historial del navegador funciona: "Volver" devuelve a donde estabas.

export function generateStaticParams() {
  return SERVICES.map((s) => ({ servicio: s.slug }));
}

// Un slug que no esté en la lista no existe: 404, no una página vacía.
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ servicio: string }>;
}): Promise<Metadata> {
  const { servicio } = await params;
  const s = getService(servicio);
  if (!s) return {};
  return {
    title: s.metaTitle,
    description: s.metaDescription,
    keywords: s.keywords,
    alternates: { canonical: `/servicios/${s.slug}` },
    openGraph: {
      type: "website",
      images: OG_IMAGE,
      title: `${s.name} — ${SITE.name}`,
      description: s.summary,
      url: `/servicios/${s.slug}`,
      locale: "es_US",
    },
  };
}

export default async function ServicioPage({
  params,
}: {
  params: Promise<{ servicio: string }>;
}) {
  const { servicio } = await params;
  const s = getService(servicio);
  if (!s) notFound();

  const { prev, next } = serviceNeighbours(s.slug);
  const wa = SITE.contact.whatsapp;

  const ld = serviceSchema({
    name: s.name,
    alternateName: s.en,
    serviceType: s.serviceType,
    description: s.summary,
    path: `/servicios/${s.slug}`,
    areaServed: s.areaServed,
  });
  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Servicios", url: "/servicios" },
    { name: s.name },
  ]);

  return (
    <>
      <Breadcrumb
        title={s.name}
        crumbs={[{ label: "Servicios", href: "/servicios" }, { label: s.name }]}
        titleAs="p"
      />
      <JsonLd data={ld} />
      <JsonLd data={breadcrumbLd} />

      <section className="pyj-may_intro">
        <div className="container">
          <div className="pyj-may_grid">
            <div>
              <span className="pyj-kicker">{s.en}</span>
              <h1 className="pyj-serv_h1">{s.heading}</h1>
              <ArticleBody blocks={s.body} />
            </div>
            <ul className="pyj-may_points">
              {s.points.map((p) => (
                <li key={p.head}>
                  <strong>{p.head}</strong>
                  <ArticleBody blocks={[{ p: p.text }]} />
                </li>
              ))}
            </ul>
          </div>

          <WorkGallery photos={s.photos} columns={s.photos.length >= 3 ? 3 : 2} priority />

          <div className="pyj-serv_cta">
            <a className="pyj-btn-gold" href={wa} target="_blank" rel="noreferrer">
              Cuéntanos tu idea por WhatsApp
            </a>
            <a className="pyj-may_phone" href={`tel:${SITE.contact.phoneTel}`}>
              o llama al {SITE.contact.phone}
            </a>
          </div>
        </div>
      </section>

      {/* Navegación entre servicios — para recorrerlos sin volver al índice. */}
      <section className="pyj-may_intro">
        <div className="container">
          <nav className="pyj-serv_nav" aria-label="Otros servicios del taller">
            {prev && (
              <Link href={`/servicios/${prev.slug}`} className="pyj-serv_navlink">
                <span className="pyj-serv_navdir">← Anterior</span>
                <span className="pyj-serv_navname">{prev.name}</span>
              </Link>
            )}
            <Link href="/servicios" className="pyj-serv_navlink pyj-serv_navlink--index">
              <span className="pyj-serv_navdir">Todos</span>
              <span className="pyj-serv_navname">Los cuatro servicios</span>
            </Link>
            {next && (
              <Link href={`/servicios/${next.slug}`} className="pyj-serv_navlink pyj-serv_navlink--next">
                <span className="pyj-serv_navdir">Siguiente →</span>
                <span className="pyj-serv_navname">{next.name}</span>
              </Link>
            )}
          </nav>
          {/* Vuelve a la página anterior de verdad (historial); si se entró
              directo, al índice de servicios. */}
          <BackLink href="/servicios" label="Volver" />
        </div>
      </section>
    </>
  );
}
