import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ArticleBody from "@/components/blog/ArticleBody";
import SafeImage from "@/components/ui/SafeImage";
import JsonLd from "@/components/seo/JsonLd";
import { getArticle, isPublished, publishedArticles } from "@/lib/blog-data";
import { SITE, SITE_URL as siteUrl } from "@/lib/site";

type Params = Promise<{ slug: string }>;

// Re-check every 6 hours so a queued article becomes reachable on its date.
export const revalidate = 21600;

// Pre-render the articles that are already live; future-dated ones render
// on-demand once their date passes (and 404 before it — see below).
export function generateStaticParams() {
  return publishedArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return { title: "Artículo no encontrado" };
  const url = `${siteUrl}/blog/${a.slug}`;
  return {
    title: a.title,
    description: a.excerpt,
    keywords: a.keywords,
    alternates: { canonical: `/blog/${a.slug}` },
    openGraph: {
      type: "article",
      title: a.title,
      description: a.excerpt,
      url,
      siteName: SITE.name,
      locale: "es_US",
      publishedTime: a.date,
      images: [{ url: `${siteUrl}${a.cover}`, alt: a.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: a.title,
      description: a.excerpt,
      images: [`${siteUrl}${a.cover}`],
    },
  };
}

function fmtDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const a = getArticle(slug);
  // Unknown slug, or a queued article whose publish date hasn't arrived yet.
  if (!a || !isPublished(a)) notFound();

  const url = `${siteUrl}/blog/${a.slug}`;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.excerpt,
    image: `${siteUrl}${a.cover}`,
    datePublished: a.date,
    dateModified: a.date,
    inLanguage: "es",
    mainEntityOfPage: url,
    keywords: a.keywords.join(", "),
    author: { "@type": "Organization", name: SITE.name, url: siteUrl },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/assets/images/logo/pedro-yoruba.png`,
      },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Diario", item: `${siteUrl}/blog` },
      { "@type": "ListItem", position: 3, name: a.title, item: url },
    ],
  };

  const others = publishedArticles()
    .filter((x) => x.slug !== a.slug)
    .slice(0, 3);

  return (
    <>
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      <Breadcrumb
        title={a.title}
        crumbs={[{ label: "Diario", href: "/blog" }, { label: a.title }]}
        bgImage={a.cover}
      />

      <div className="pyj-article-wrap">
        <div className="container">
          <article className="pyj-article">
            <div className="pyj-article-meta">
              {a.category} · {fmtDate(a.date)} · {a.readingMinutes} min de lectura
            </div>

            <ArticleBody blocks={a.blocks} />

            {a.cta && (
              <div className="pyj-article-cta">
                <Link href={a.cta.href} className="pyj-btn-gold">
                  {a.cta.label}
                </Link>
              </div>
            )}
          </article>

          {others.length > 0 && (
            <div className="pyj-article-more">
              <h3>Sigue leyendo</h3>
              <div className="pyj-blog-grid">
                {others.map((o) => (
                  <article className="pyj-blog-card" key={o.slug}>
                    <Link href={`/blog/${o.slug}`} className="pyj-blog-cover">
                      <SafeImage src={o.cover} width={600} alt={o.title} />
                      <span className="pyj-blog-tag">{o.category}</span>
                    </Link>
                    <div className="pyj-blog-body">
                      <h2>
                        <Link href={`/blog/${o.slug}`}>{o.title}</Link>
                      </h2>
                      <Link href={`/blog/${o.slug}`} className="pyj-blog-more">
                        Leer más →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
