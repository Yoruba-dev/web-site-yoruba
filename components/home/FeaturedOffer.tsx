import Link from "next/link";
import { getFeaturedOffer } from "@/lib/featured-offer";

// Home "Oferta destacada" band — reads the featured on-sale piece LIVE (shared
// with the startup popup via getFeaturedOffer). Renders only when there's an
// active offer, so it turns itself off when the sale ends.
export default async function FeaturedOffer() {
  const offer = await getFeaturedOffer();
  if (!offer) return null;

  return (
    <section className="pyj-offer" aria-label="Oferta destacada">
      <div className="container">
        <div className="pyj-offer_card">
          <Link
            href={offer.href}
            className="pyj-offer_media"
            tabIndex={-1}
            aria-hidden="true"
          >
            {offer.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={offer.image} alt={offer.title} loading="lazy" />
            )}
            <span className="pyj-offer_pct">
              <b>{offer.pct}%</b>
              <small>OFF</small>
            </span>
          </Link>

          <div className="pyj-offer_body">
            <span className="pyj-eyebrow">✦ Oferta destacada ✦</span>
            <h2 className="pyj-offer_title">{offer.title}</h2>
            <p className="pyj-offer_sub">
              Por tiempo limitado — <strong>ahorra {offer.saved}</strong> en esta pieza.
            </p>
            <div className="pyj-offer_prices">
              <span className="pyj-offer_was">{offer.was}</span>
              <span className="pyj-offer_now">{offer.now}</span>
            </div>
            <Link href={offer.href} className="pyj-btn-gold pyj-offer_cta">
              Aprovechar la oferta
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
