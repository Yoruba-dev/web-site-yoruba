import Link from "next/link";
import { getFeaturedOffer } from "@/lib/featured-offer";
import { getPromo } from "@/lib/promo";

// ---------------------------------------------------------------------------
// Banda de "Ofertas" de la portada. Pinta TODAS las ofertas vivas, cada una en
// la misma tarjeta, y desaparece entera cuando no hay ninguna.
//
// Hoy pueden ser dos, y son de naturaleza distinta:
//   1. Rebaja de precio  — una pieza con el precio tachado (lib/featured-offer).
//   2. Oferta cruzada    — compra A y llévate B más barato (lib/promo).
//
// La segunda necesita un aviso extra que la primera no: su precio grande es el
// de la MONEDA, no el del anillo. Sin esa aclaración alguien puede creer que el
// anillo cuesta $160, y eso es una decepción garantizada en el carrito.
// ---------------------------------------------------------------------------

interface Tarjeta {
  clave: string;
  href: string;
  image?: string;
  eyebrow: string;
  title: string;
  sub: React.ReactNode;
  was: string;
  now: string;
  /** Aclaración bajo los precios, cuando el precio no es el de la pieza del título. */
  nota?: string;
  cta: string;
}

export default async function FeaturedOffer() {
  const [rebaja, promo] = await Promise.all([getFeaturedOffer(), getPromo()]);

  const tarjetas: Tarjeta[] = [];

  if (rebaja) {
    tarjetas.push({
      clave: "rebaja",
      href: rebaja.href,
      image: rebaja.image,
      eyebrow: "✦ Oferta destacada ✦",
      title: rebaja.title,
      sub: (
        <>
          Por tiempo limitado — <strong>ahorra {rebaja.saved}</strong> en esta pieza.
        </>
      ),
      was: rebaja.was,
      now: rebaja.now,
      cta: "Aprovechar la oferta",
    });
  }

  if (promo) {
    tarjetas.push({
      clave: "cruzada",
      href: `/products/${promo.gatillo.handle}`,
      image: "/assets/images/promo/anillo-moneda.webp",
      eyebrow: "✦ Oferta del mes ✦",
      title: "Anillo de Ifá + Moneda",
      sub: (
        <>
          Compra tu anillo y la moneda te sale a{" "}
          <strong>{promo.ahora} en vez de {promo.antes}</strong>.
        </>
      ),
      was: promo.antes,
      now: promo.ahora,
      nota: "Precio de la moneda. El descuento se aplica llevando las dos piezas.",
      cta: "Ver la oferta",
    });
  }

  if (tarjetas.length === 0) return null;

  return (
    <section className="pyj-offer" aria-label="Ofertas">
      <div className="container">
        <div className="pyj-offer_lista">
          {tarjetas.map((t) => (
            <div className="pyj-offer_card" key={t.clave}>
              <Link
                href={t.href}
                className="pyj-offer_media"
                tabIndex={-1}
                aria-hidden="true"
              >
                {t.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.image} alt={t.title} loading="lazy" />
                )}
              </Link>

              <div className="pyj-offer_body">
                <span className="pyj-eyebrow">{t.eyebrow}</span>
                <h2 className="pyj-offer_title">{t.title}</h2>
                <p className="pyj-offer_sub">{t.sub}</p>
                <div className="pyj-offer_prices">
                  <span className="pyj-offer_was">{t.was}</span>
                  <span className="pyj-offer_now">{t.now}</span>
                </div>
                {t.nota && <p className="pyj-offer_nota">{t.nota}</p>}
                <Link href={t.href} className="pyj-btn-gold pyj-offer_cta">
                  {t.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
