import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/layout/Breadcrumb";
import SafeImage from "@/components/ui/SafeImage";
import { publishedArticles } from "@/lib/blog-data";

// Re-check every 6 hours so queued (future-dated) articles go live on their own
// once their publish date arrives — no manual rebuild needed.
export const revalidate = 21600;

export const metadata: Metadata = {
  title: "Diario — Tradición Yoruba y guía de joyería",
  description:
    "Artículos sobre la tradición Yoruba y la joyería religiosa: el Idde de Orula, los colores de los Orishas, tipos de oro y herramientas de santo. Por Pedro Yoruba Jewelry.",
  keywords: [
    "blog joyería yoruba",
    "tradición lucumí",
    "idde de orula",
    "colores de los orishas",
    "herramientas de santo",
  ],
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    title: "Diario — Pedro Yoruba Jewelry",
    description:
      "Tradición Yoruba y guía de joyería: Idde de Orula, colores de los Orishas, tipos de oro y herramientas de santo.",
    url: "/blog",
    locale: "es_US",
  },
};

function fmtDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BlogPage() {
  const articles = publishedArticles();
  return (
    <>
      <Breadcrumb title="Diario" crumbs={[{ label: "Diario" }]} />
      <div className="pyj-blog">
        <div className="container">
          <div className="pyj-blog-intro">
            <p className="pyj-eyebrow">✦ Tradición y oficio ✦</p>
            <h1>El Diario de la casa</h1>
            <p>
              Historias, significado y guía para llevar tu fe puesta — de nuestro
              taller en Miami.
            </p>
          </div>

          <div className="pyj-blog-grid">
            {articles.map((a) => (
              <article className="pyj-blog-card" key={a.slug}>
                <Link href={`/blog/${a.slug}`} className="pyj-blog-cover">
                  <SafeImage src={a.cover} width={800} alt={a.title} />
                  <span className="pyj-blog-tag">{a.category}</span>
                </Link>
                <div className="pyj-blog-body">
                  <div className="pyj-blog-meta">
                    {fmtDate(a.date)} · {a.readingMinutes} min de lectura
                  </div>
                  <h2>
                    <Link href={`/blog/${a.slug}`}>{a.title}</Link>
                  </h2>
                  <p>{a.excerpt}</p>
                  <Link href={`/blog/${a.slug}`} className="pyj-blog-more">
                    Leer más →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
