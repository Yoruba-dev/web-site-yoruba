import { Fragment } from "react";
import { getNewArrivals, getProducts } from "@/lib/products";
import { attachRatings } from "@/lib/product-ratings";
import { ORISHA_NAMES } from "@/lib/orishas";
import type { Product } from "@/lib/types";
import HeroSlider from "@/components/home/HeroSlider";
import ProductSlider from "@/components/product/ProductSlider";
import BannerGrid from "@/components/home/BannerGrid";
import FeaturedOffer from "@/components/home/FeaturedOffer";
import CategorySection from "@/components/home/CategorySection";
import CategoryCircles from "@/components/home/CategoryCircles";
import WholesaleBanner from "@/components/home/WholesaleBanner";
import { getCollections } from "@/lib/products";

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
  // Attach real Judge.me review stars to every card on the home page. `all`
  // feeds the herramientas + category rows; `recent` feeds Novedades. The rating
  // lookups share a global hourly data cache with the shop page, so this is cheap.
  const all = await attachRatings(await getProducts(150));
  const collections = await getCollections();
  // "Novedades" blends the most recently added pieces with the best-valued
  // (best-selling) ones: newest first, then popular pieces not already shown.
  // `all` comes back in Shopify BEST_SELLING order, so its head = top pieces.
  const recent = await attachRatings(await getNewArrivals(12));
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
      {/* The hero is a designed banner image (text baked in), so the page's
          real <h1> is visually hidden — it still gives crawlers a clear main
          heading. */}
      <h1
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        Pedro Yoruba Jewelry — Joyería Yoruba en oro 10k, 14k y 18k, hecha a
        mano en Miami
      </h1>

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

      {/* Oferta destacada — live promo band for the featured on-sale piece,
          placed high so the deal gets top billing right under Novedades. */}
      <FeaturedOffer />

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

      {/* Categorías de Productos — circular carousel served from Shopify collections */}
      <CategoryCircles collections={collections} />

      {/* Herramientas de Santo — featured, religion-focused (specialty of the house) */}
      <CategorySection
        title="Herramientas de Santo"
        subtitle="Instrumentos sagrados de cada Oricha — forjados a mano para tu Ocha e Ifá. Piezas de fundamento para el culto, la coronación y el trono."
        products={herramientas.slice(0, 12)}
        href="/shop-left-sidebar?cat=Herramientas"
      />

      {/* Mayoristas y botánicas — B2B wholesale channel */}
      <WholesaleBanner />

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

      {/* Entity block — the ONE citable paragraph on the home that says who we
          are and where (search + AI engines had nothing to quote here before). */}
      <section className="pyj-entity">
        <div className="container">
          <h2>Joyería Yoruba hecha a mano en Miami</h2>
          <p>
            <strong>Pedro Yoruba Jewelry</strong> es un taller-joyería en el
            oeste de Miami, Florida (11865 SW 26th St. c-41, zona de Tamiami
            junto a Westchester). Fabricamos a mano piezas de la tradición
            Yoruba / Lucumí — Idde de Orula, elekes, herramientas de santo,
            coronas, anillos y esclavas — en oro de 10k, 14k y 18k, plata y
            acero inoxidable, con garantía de por vida. Atendemos en tienda de
            lunes a sábado, hacemos piezas por encargo a la medida de tu santo,
            enviamos a todo Estados Unidos y surtimos al por mayor a botánicas.
          </p>
          <p>
            <a href="/joyeria-en-miami">Lee nuestra guía: joyería en Miami →</a>
          </p>
        </div>
      </section>
    </>
  );
}
