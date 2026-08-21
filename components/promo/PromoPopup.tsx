"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { PromoVM } from "@/lib/promo";

// ---------------------------------------------------------------------------
// Popup de la oferta cruzada — "compra el anillo y llévate la moneda".
//
// El diseño viene del handoff "Popup Oferta Anillo IFA": dos columnas, foto a la
// izquierda y contenido a la derecha, entrada con rebote, brillo recorriendo el
// botón y burbuja para reabrirlo. Se ha recreado con los patrones de esta web,
// no copiado: el prototipo pedía la tipografía Jost y aquí se usa Lato, que es
// la de interfaz del sitio, para no cargar una fuente más solo por un popup.
//
// LO QUE NO ESTÁ ESCRITO A MANO: ni los precios, ni el porcentaje, ni las
// fechas. Todo sale de lib/promo.ts, que se lo pregunta a Shopify. Cuando el
// descuento caduque, `promo` llegará nulo y esto no se pinta. Nadie tiene que
// acordarse de apagarlo.
// ---------------------------------------------------------------------------

const CLAVE = "pyj-promo-anillo-moneda";

export default function PromoPopup({ promo }: { promo: PromoVM }) {
  const [abierto, setAbierto] = useState(false);
  const [cerrado, setCerrado] = useState(false);
  const pathname = usePathname();

  // La clave lleva el precio: si el dueño cambia la oferta, se le vuelve a
  // enseñar a quien ya la había cerrado.
  const clave = `${CLAVE}:${promo.ahora}`;

  // ¿Está mirando justamente una de las piezas de la oferta? Entonces el aviso
  // llega antes: ya está interesado, no hay que esperar a que se aburra.
  const enPiezaDeLaOferta =
    promo.gatilloHandles.some((h) => pathname === `/products/${h}`) ||
    pathname === `/products/${promo.regalo.handle}`;

  useEffect(() => {
    let visto = false;
    try {
      visto = localStorage.getItem(clave) === "1";
    } catch {
      /* modo incógnito: se enseña igual */
    }
    if (visto) {
      setCerrado(true);
      return;
    }

    const abrir = () => setAbierto(true);
    // Dos disparadores, gana el primero:
    //  1) el tiempo — 2 s en las fichas de la oferta, 5 s en el resto
    //  2) el scroll — al pasar dos pantallas, señal de que está mirando en serio
    const t = setTimeout(abrir, enPiezaDeLaOferta ? 2000 : 5000);
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 2) abrir();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, [clave, enPiezaDeLaOferta]);

  const cerrar = useCallback(() => {
    setAbierto(false);
    setCerrado(true);
    try {
      localStorage.setItem(clave, "1");
    } catch {
      /* ignore */
    }
  }, [clave]);

  // Escape cierra: lo pedía el handoff y es lo que espera cualquiera.
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [abierto, cerrar]);

  // El banner de la promoción, ya recortado para quitarle el texto que trae
  // horneado — el título y los precios los pone este popup en HTML, así que
  // repetirlos dentro de la foto quedaría redundante y además no se podrían
  // actualizar solos cuando cambie la oferta en Shopify.
  // Si algún día no estuviera, cae a la foto del anillo que da Shopify.
  const BANNER = "/assets/images/promo/anillo-moneda.webp";
  const foto = BANNER;
  const fotoAlt = promo.gatillo.image ?? promo.regalo.image;

  return (
    <>
      {abierto && (
        <>
          <div className="pyj-promo_overlay" onClick={cerrar} aria-hidden="true" />
          <div className="pyj-promo_wrap" role="dialog" aria-modal="true" aria-labelledby="pyj-promo-tit">
            <div className="pyj-promo_modal">
              <button type="button" className="pyj-promo_x" onClick={cerrar} aria-label="Cerrar la oferta">
                ✕
              </button>

              <div className="pyj-promo_foto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto}
                  alt={`${promo.gatillo.title} y ${promo.regalo.title}`}
                  onError={(e) => {
                    if (fotoAlt) e.currentTarget.src = fotoAlt;
                  }}
                />
                <span className="pyj-promo_velo" aria-hidden="true" />
              </div>

              <div className="pyj-promo_texto">
                <p className="pyj-promo_eyebrow">
                  <span aria-hidden="true" /> SOLO ESTE MES <span aria-hidden="true" />
                </p>
                <h2 className="pyj-promo_tit" id="pyj-promo-tit">
                  Oferta Especial del Mes
                </h2>
                <p className="pyj-promo_copy">
                  Compra tu <strong>{promo.gatillo.title.split("—")[0].trim()}</strong> y
                  llévate la <strong>{promo.regalo.title}</strong> por mucho menos.
                </p>

                <p className="pyj-promo_precios">
                  <span className="pyj-promo_antes">{promo.antes}</span>
                  <span className="pyj-promo_ahora">{promo.ahora}</span>
                  <span className="pyj-promo_div">USD</span>
                </p>

                {/* La condición, dicha sin rodeos: es lo que pidió el dueño. El
                    descuento es de la moneda y solo llevando las dos piezas. */}
                <p className="pyj-promo_condicion">
                  El descuento es sobre la moneda, y se aplica{" "}
                  <strong>llevando las dos piezas en el carrito</strong>.
                </p>

                <Link
                  href={`/products/${promo.gatillo.handle}`}
                  className="pyj-promo_cta"
                  onClick={cerrar}
                >
                  VER LA OFERTA
                  <span className="pyj-promo_brillo" aria-hidden="true" />
                </Link>

                <p className="pyj-promo_confianza">
                  <span>✦ Grabado personalizado</span>
                  <span>✦ Envío asegurado</span>
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {cerrado && (
        <button
          type="button"
          className="pyj-promo_burbuja"
          aria-label={`Ver la oferta del mes, ahorras ${promo.ahorro}`}
          onClick={() => {
            setCerrado(false);
            setAbierto(true);
          }}
        >
          <span aria-hidden="true">✦</span> Ver la oferta
        </button>
      )}
    </>
  );
}
