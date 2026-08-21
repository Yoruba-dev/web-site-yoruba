"use client";

import { useCart, type CartLine } from "@/lib/cart-context";
import type { PromoVM } from "@/lib/promo";

// ---------------------------------------------------------------------------
// El recordatorio de "te falta la moneda", justo antes de pagar.
//
// POR QUÉ AÑADE EN VEZ DE MANDAR AL PRODUCTO
// ------------------------------------------
// Quien pulsa "pagar" ya decidió comprar. Sacarlo de ahí para que navegue a otra
// ficha, elija variante y vuelva es donde se caen los carritos: cada paso extra
// pierde gente. Aquí la moneda se añade EN EL SITIO, con un toque, y sigue al
// pago sin salirse. El botón secundario deja pasar sin ella, sin pelear.
//
// Se enseña UNA sola vez por intento: si dice "pagar sin ella", no se le vuelve
// a interponer. Un recordatorio ayuda; dos son un peaje.
//
// Añade la variante EXACTA que lleva el descuento (`regalo.variantId`, la de
// grabado láser). Si añadiera la otra, Shopify no aplicaría nada y la clienta
// vería un precio que no es.
// ---------------------------------------------------------------------------

export default function PromoRecordatorio({
  promo,
  onAnadirYSeguir,
  onSeguirSinElla,
}: {
  promo: PromoVM;
  /** Añadir la moneda y continuar al pago. Recibe la línea recién añadida
   *  porque el estado del carrito todavía no se ha refrescado cuando esto
   *  vuelve, y el pago tiene que incluirla YA. */
  onAnadirYSeguir: (linea: CartLine) => void;
  /** Continuar sin ella. */
  onSeguirSinElla: () => void;
}) {
  const { addLine } = useCart();

  function anadir() {
    const linea: CartLine = {
      id: promo.regalo.variantId,
      merchandiseId: promo.regalo.variantId,
      productHandle: promo.regalo.handle,
      title: `${promo.regalo.title} — ${promo.regalo.variantTitle}`,
      image: promo.regalo.image ?? "",
      price: promo.regalo.precio,
      currencyCode: promo.regalo.currency,
      quantity: 1,
    };
    const { quantity, ...sinCantidad } = linea;
    addLine(sinCantidad, quantity);
    onAnadirYSeguir(linea);
  }

  return (
    <>
      <div className="pyj-promo_overlay" onClick={onSeguirSinElla} aria-hidden="true" />
      <div className="pyj-promo_wrap" role="dialog" aria-modal="true" aria-labelledby="pyj-rec-tit">
        <div className="pyj-promo_modal pyj-rec_modal">
          <div className="pyj-promo_foto pyj-rec_foto">
            {promo.regalo.image && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={promo.regalo.image} alt={promo.regalo.title} />
            )}
            <span className="pyj-promo_velo" aria-hidden="true" />
          </div>

          <div className="pyj-promo_texto">
            <p className="pyj-promo_eyebrow">
              <span aria-hidden="true" /> ANTES DE PAGAR <span aria-hidden="true" />
            </p>
            <h2 className="pyj-promo_tit" id="pyj-rec-tit">
              Te falta la moneda
            </h2>
            <p className="pyj-promo_copy">
              Llevas el anillo, así que la <strong>{promo.regalo.title}</strong> te
              sale a <strong>{promo.ahora}</strong> en vez de {promo.antes}. Si
              pagas sin ella, pierdes los {promo.ahorro}.
            </p>

            <p className="pyj-promo_precios">
              <span className="pyj-promo_antes">{promo.antes}</span>
              <span className="pyj-promo_ahora">{promo.ahora}</span>
              <span className="pyj-promo_div">{promo.regalo.variantTitle}</span>
            </p>

            <button type="button" className="pyj-promo_cta" onClick={anadir}>
              AÑADIRLA Y PAGAR
              <span className="pyj-promo_brillo" aria-hidden="true" />
            </button>

            <button type="button" className="pyj-rec_no" onClick={onSeguirSinElla}>
              Pagar sin la moneda
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
