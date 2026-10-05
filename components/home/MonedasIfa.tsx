import { getProductByHandle } from "@/lib/products";
import { getPromoVentana } from "@/lib/promo-ventana";
import { SECCION_MONEDAS } from "@/lib/site";
import { formatMoney } from "@/lib/utils";

// La sección fija "Monedas de Ifá" de la portada.
//
// Nació del banner de la promo de la moneda (octubre de 2026): misma foto y
// mismo diseño (.pyj-promoP), pero sin descuento ni reloj. El precio se lee en
// vivo de Shopify, así que nunca se queda desfasado.
//
// Mientras la pieza esté en una promo por tiempo limitado no sale: el banner de
// la promo ya la anuncia arriba del todo, y dos anuncios de la misma moneda con
// dos precios distintos confundirían. Cuando la promo termina, aparece sola.

const FOTO = "/assets/images/monedas/moneda-ifa-marmol";

export default async function MonedasIfa() {
  const [promo, pieza] = await Promise.all([
    getPromoVentana(),
    getProductByHandle(SECCION_MONEDAS.handle),
  ]);
  if (!pieza) return null;
  if (promo?.handles.includes(pieza.handle)) return null;

  const minimo = Number(pieza.price.amount);
  const desde = pieza.variants.some((v) => Number(v.price.amount) > minimo);
  const precio = formatMoney(pieza.price).replace(/\.00$/, "");

  return (
    <section className="pyj-promoP pyj-promoP--fija" aria-labelledby="pyj-monedas-tit">
      <div className="pyj-promoP_foto">
        <picture>
          <source
            type="image/avif"
            srcSet={`${FOTO}-640.avif 640w, ${FOTO}-1024.avif 1024w`}
            sizes="(max-width: 991px) 100vw, 62vw"
          />
          <source
            type="image/webp"
            srcSet={`${FOTO}-640.webp 640w, ${FOTO}-1024.webp 1024w`}
            sizes="(max-width: 991px) 100vw, 62vw"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${FOTO}-1024.webp`}
            alt="Moneda de Ifá de los 16 Meyis en plata 925 sobre mármol negro con vetas de oro"
            width={1024}
            height={1024}
            loading="lazy"
            decoding="async"
          />
        </picture>
      </div>
      <div className="container">
        <div className="pyj-promoP_texto">
          <span className="pyj-eyebrow">✦ Monedas de Ifá ✦</span>
          <h2 id="pyj-monedas-tit" className="pyj-promoP_tit">
            La Moneda de Ifá de los 16 Meyis
          </h2>
          <p className="pyj-promoP_precio">
            {desde && <span className="pyj-promoP_desde">Desde</span>}
            <b>{precio}</b>
            <span className="pyj-promoP_ahorro">plata 925 · 36.5 mm</span>
          </p>
          <p className="pyj-promoP_desc">
            Hecha a mano, con los 16 Meyis alrededor y tu signo grabado incluido.
            Envío o recogida en la tienda.
          </p>
          <a href={`/collections/${SECCION_MONEDAS.coleccion}`} className="pyj-btn-gold">
            Ver las monedas
          </a>
        </div>
      </div>
    </section>
  );
}
