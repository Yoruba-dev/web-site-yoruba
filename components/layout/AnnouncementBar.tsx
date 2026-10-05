"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { whatsappWholesaleUrl } from "@/lib/commerce";

// Slim, dismissible band above the header — highest-visibility surface, shown on
// every page. Normally announces the wholesale (mayoreo) channel for
// botánicas/shops. While a time-limited promo is live (lib/promo-ventana.ts) it
// announces THAT instead, and goes back to mayoreo on its own when the promo
// ends — by the visitor's clock, since pages come from cache.
// Each message remembers its own dismissal in localStorage, so closing the
// mayoreo notice months ago never hides a new promo.
const DISMISS_KEY = "pyj-mayoreo-bar";

export interface PromoBarra {
  titulo: string;
  href: string;
  /** Fin absoluto (ISO) o null si la promo no tiene fecha. */
  hasta: string | null;
  /** "miércoles 7 de octubre", ya en hora de Miami. */
  fecha: string | null;
}

function leer(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export default function AnnouncementBar({ promo }: { promo?: PromoBarra | null }) {
  const promoKey = promo ? `pyj-promo-bar:${promo.hasta ?? promo.href}` : null;
  // The server render shows the promo when there is one (first-time visitors
  // get it in the SSR HTML); the effect below corrects it after mount.
  const [verPromo, setVerPromo] = useState(Boolean(promo));
  const [verMayoreo, setVerMayoreo] = useState(true);

  useEffect(() => {
    const objetivo = promo?.hasta ? Date.parse(promo.hasta) : NaN;
    const revisar = () => {
      const viva =
        Boolean(promo) &&
        !(promoKey && leer(promoKey)) &&
        !(Number.isFinite(objetivo) && Date.now() > objetivo);
      setVerPromo(viva);
    };
    revisar();
    setVerMayoreo(!leer(DISMISS_KEY));
    if (!Number.isFinite(objetivo)) return;
    const id = setInterval(revisar, 30_000);
    return () => clearInterval(id);
  }, [promo, promoKey]);

  const cerrar = (key: string, ocultar: () => void) => {
    ocultar();
    try {
      localStorage.setItem(key, "1");
    } catch {
      /* ignore storage errors */
    }
  };

  if (promo && verPromo && promoKey) {
    return (
      <div className="pyj-annbar">
        <div className="pyj-annbar_inner">
          <a className="pyj-annbar_msg" href={promo.href}>
            <span className="pyj-annbar_tag">Oferta</span>
            <span>
              <strong>{promo.titulo}</strong>
              {promo.fecha && <> — solo hasta el {promo.fecha}</>}
            </span>
          </a>
          <a className="pyj-annbar_more" href={promo.href}>
            Ver oferta →
          </a>
          <button
            type="button"
            className="pyj-annbar_close"
            aria-label="Cerrar aviso de la oferta"
            onClick={() => cerrar(promoKey, () => setVerPromo(false))}
          >
            <i className="ion-android-close" />
          </button>
        </div>
      </div>
    );
  }

  if (!verMayoreo) return null;

  return (
    <div className="pyj-annbar">
      <div className="pyj-annbar_inner">
        <a
          className="pyj-annbar_msg"
          href={whatsappWholesaleUrl()}
          target="_blank"
          rel="noreferrer"
        >
          <span className="pyj-annbar_tag">Mayorista</span>
          <span>
            Surtimos a <strong>botánicas y tiendas</strong> — escríbenos por
            WhatsApp para catálogo y precios de mayorista
          </span>
        </a>
        <Link className="pyj-annbar_more" href="/mayoreo">
          Más info →
        </Link>
        <button
          type="button"
          className="pyj-annbar_close"
          aria-label="Cerrar aviso"
          onClick={() => cerrar(DISMISS_KEY, () => setVerMayoreo(false))}
        >
          <i className="ion-android-close" />
        </button>
      </div>
    </div>
  );
}
