import { getProducts } from "@/lib/products";
import HeroSlider from "@/components/home/HeroSlider";
import ProductSlider from "@/components/product/ProductSlider";
import ProductTabs from "@/components/home/ProductTabs";
import BannerGrid from "@/components/home/BannerGrid";
import StaticBanner from "@/components/home/StaticBanner";
import OrishaShowcase from "@/components/home/OrishaShowcase";
import SectionTitle from "@/components/ui/SectionTitle";

const SHIPPING = [
  { icon: "1.png", title: "Envío a todo USA", text: "En pedidos sobre $75" },
  { icon: "2.png", title: "Hecho a mano", text: "Oro 10k, plata y acero" },
  { icon: "3.png", title: "Piezas por encargo", text: "Para cada Oricha" },
  { icon: "4.png", title: "Calidad garantizada", text: "Acabado artesanal" },
];

// rotate an array so each tabbed section leads with different items
function rotate<T>(arr: T[], by: number): T[] {
  if (arr.length === 0) return arr;
  const n = by % arr.length;
  return [...arr.slice(n), ...arr.slice(0, n)];
}

// Full Home Two layout (ported from index-2.html):
// hero → shipping → New Arrival → tabs → banner → tabs → banner → tabs.
export default async function HomePage() {
  const all = await getProducts(60);

  return (
    <>
      <HeroSlider />

      {/* Shipping bar (Two) */}
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

      {/* Shop by Orisha — Santería identity section */}
      <OrishaShowcase />

      {/* New Arrival (5-up slider) */}
      <div className="hiraola-product_area">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <SectionTitle title="Novedades" />
            </div>
            <div className="col-lg-12">
              <ProductSlider products={all.slice(0, 10)} />
            </div>
          </div>
        </div>
      </div>

      {/* Featured Product promo banner (-25% Off This Week) */}
      <StaticBanner />

      {/* Tabbed: New Products */}
      <ProductTabs products={all} title="Piezas para los Orishas" />

      {/* Promo banners (2-up) */}
      <BannerGrid images={["1_5.jpg", "1_6.jpg"]} colClass="col-lg-6" />

      {/* Tabbed: Featured Products */}
      <ProductTabs products={rotate(all, 4)} title="Hechas a Mano" />

      {/* Promo banners (3-up) */}
      <BannerGrid images={["1_5.jpg", "1_6.jpg", "1_5.jpg"]} colClass="col-lg-4" fluid />

      {/* Tabbed: Trending Products */}
      <ProductTabs products={rotate(all, 8)} title="Lo Más Buscado" />
    </>
  );
}
