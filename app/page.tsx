import { Fragment } from "react";
import { getNewArrivals, getProducts } from "@/lib/products";
import { ORISHA_NAMES } from "@/lib/orishas";
import type { Product } from "@/lib/types";
import HeroSlider from "@/components/home/HeroSlider";
import ProductSlider from "@/components/product/ProductSlider";
import BannerGrid from "@/components/home/BannerGrid";
import StaticBanner from "@/components/home/StaticBanner";
import CategorySection from "@/components/home/CategorySection";

const SHIPPING = [
  { icon: "1.png", title: "Envío a todo USA", text: "En pedidos sobre $75" },
  { icon: "2.png", title: "Hecho a mano", text: "Oro 10k, plata y acero" },
  { icon: "3.png", title: "Piezas por encargo", text: "Para cada Oricha" },
  { icon: "4.png", title: "Garantía de por vida", text: "En todas nuestras piezas" },
];

// Top piece-type categories (by product count) for the strategic home rows —
// biggest categories lead. Orisha tags are excluded (they have their own showcase).
function topCategories(products: Product[], limit: number): string[] {
  const counts = new Map<string, number>();
  products.forEach((p) =>
    p.tags.forEach((t) => {
      if (!ORISHA_NAMES.includes(t)) counts.set(t, (counts.get(t) ?? 0) + 1);
    }),
  );
  return [...counts.entries()]
    .filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);
}

// Home Two layout: hero → shipping → Orishas → Novedades → banner → category
// rows (organized by piece type, biggest first) with promo banners interleaved.
export default async function HomePage() {
  const all = await getProducts(150);
  // "Novedades" blends the most recently added pieces with the best-valued
  // (best-selling) ones: newest first, then popular pieces not already shown.
  // `all` comes back in Shopify BEST_SELLING order, so its head = top pieces.
  const recent = await getNewArrivals(12);
  const recentIds = new Set(recent.map((p) => p.id));
  const bestValued = all.filter((p) => !recentIds.has(p.id)).slice(0, 12);
  const newArrivals = [...recent, ...bestValued].slice(0, 20);
  // "Herramientas de Santo" gets its own featured, religion-framed row up top, so
  // keep it out of the generic category rows below (avoid showing it twice).
  const herramientas = all.filter((p) => p.tags.includes("Herramientas"));
  const cats = topCategories(all, 7)
    .filter((c) => c !== "Herramientas")
    .slice(0, 6);

  return (
    <>
      <HeroSlider />

      {/* Recién llegado — front-and-center right under the hero so a new piece
          (like the Virgen de la Caridad) is seen without any searching. */}
      <section className="pyj-newarrivals">
        <div className="container">
          <div className="pyj-newarrivals_head">
            <span className="pyj-eyebrow">✦ Recién llegado ✦</span>
            <h2>Novedades</h2>
            <p>Lo más nuevo y lo más querido del taller — véelo antes que nadie.</p>
          </div>
          <ProductSlider products={newArrivals} autoplay />
          <div className="pyj-newarrivals_cta">
            <a href="/shop-left-sidebar" className="pyj-btn-gold">
              Ver toda la colección
            </a>
          </div>
        </div>
      </section>

      {/* Shipping bar */}
      <div className="hiraola-shipping_area hiraola-shipping_area-2">
        <div className="container">
          <div className="shipping-nav">
            <div className="row">
              {SHIPPING.map((s) => (
                <div className="col-lg-3 col-md-6" key={s.icon}>
                  <div className="shipping-item">
                    <div className="shipping-icon">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/assets/images/shipping-icon/${s.icon}`} alt={s.title} />
                    </div>
                    <div className="shipping-content">
                      <h6>{s.title}</h6>
                      <p>{s.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Herramientas de Santo — featured, religion-focused (specialty of the house) */}
      <CategorySection
        title="Herramientas de Santo"
        subtitle="Instrumentos sagrados de cada Oricha — forjados a mano para tu Ocha e Ifá. Piezas de fundamento para el culto, la coronación y el trono."
        products={herramientas.slice(0, 12)}
        href="/shop-left-sidebar?cat=Herramientas"
      />

      {/* Featured Product promo banner */}
      <StaticBanner />

      {/* Category rows — organized by piece type, biggest first */}
      {cats.map((cat, i) => (
        <Fragment key={cat}>
          <CategorySection
            title={cat}
            products={all.filter((p) => p.tags.includes(cat)).slice(0, 12)}
            href={`/shop-left-sidebar?cat=${encodeURIComponent(cat)}`}
          />
          {i === 1 && <BannerGrid images={["1_5.jpg", "1_6.jpg"]} colClass="col-lg-6" />}
          {i === 3 && (
            <BannerGrid images={["1_5.jpg", "1_6.jpg", "1_5.jpg"]} colClass="col-lg-4" fluid />
          )}
        </Fragment>
      ))}
    </>
  );
}
