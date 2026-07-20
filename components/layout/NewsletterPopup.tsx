"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { subscribeToMarketing } from "@/lib/subscribe";
import type { FeaturedOfferVM } from "@/lib/featured-offer";

const STORAGE_KEY = "hiraola_newsletter_dismissed";

// Appears 5s after load, dismissible (desktop only — the theme hides the popup
// under 992px). Two modes:
//  • offer present  → promotes the featured sale (same gold look as the home
//    "Oferta destacada" band), with its own per-product dismissal key so a NEW
//    promo shows even to visitors who dismissed the newsletter before.
//  • no offer       → the newsletter signup, which captures the email into the
//    cart context for abandoned-cart recovery + the marketing list.
export default function NewsletterPopup({
  offer,
}: {
  offer?: FeaturedOfferVM | null;
}) {
  const { setEmail } = useCart();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [dontShow, setDontShow] = useState(false);
  const [sent, setSent] = useState(false);

  const storageKey = offer ? `pyj-popup-offer:${offer.href}` : STORAGE_KEY;

  useEffect(() => {
    if (localStorage.getItem(storageKey)) return;
    const t = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(t);
  }, [storageKey]);

  function remember() {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
  }

  function startClose() {
    setClosing(true);
    setTimeout(() => setVisible(false), 500);
  }

  function close() {
    // An offer popup is a one-per-visitor promo, so remember it on close too.
    if (offer || dontShow || sent) remember();
    startClose();
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get("email");
    const address = typeof value === "string" ? value.trim() : "";
    if (!address) return;
    setEmail(address); // → attaches to the cart for abandoned-cart recovery
    subscribeToMarketing(address); // → adds them to Shopify's marketing list
    setSent(true);
    remember();
    setTimeout(startClose, 2600);
  }

  if (!visible) return null;

  const wrapperStyle = {
    opacity: closing ? 0 : 1,
    visibility: "visible" as const,
    transition: "opacity 0.5s ease",
  };

  // --- Offer mode: promote the featured sale ---
  if (offer) {
    return (
      <div className="popup_wrapper" style={wrapperStyle}>
        <div className="test pyj-pop--offer">
          <span className="popup_off" onClick={close}>
            <i className="ion-android-close" />
          </span>
          <div className="subscribe_area">
            <span className="pyj-eyebrow">✦ Oferta destacada ✦</span>
            <h2>{offer.title}</h2>
            <p>
              Por tiempo limitado — <strong>ahorra {offer.saved}</strong> en esta
              pieza.
            </p>
            <div className="pyj-offer_prices">
              <span className="pyj-offer_was">{offer.was}</span>
              <span className="pyj-offer_now">{offer.now}</span>
            </div>
            <a href={offer.href} className="pyj-btn-gold pyj-pop_cta" onClick={remember}>
              Aprovechar la oferta
            </a>
          </div>
          {offer.image && (
            <div className="pyj-pop_media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={offer.image} alt={offer.title} />
              <span className="pyj-offer_pct">
                <b>{offer.pct}%</b>
                <small>OFF</small>
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Newsletter mode (no active offer) ---
  return (
    <div className="popup_wrapper" style={wrapperStyle}>
      <div className="test">
        <span className="popup_off" onClick={close}>
          <i className="ion-android-close" />
        </span>
        <div className="subscribe_area">
          {sent ? (
            <>
              <h2>¡Gracias! ✦</h2>
              <p>
                Te avisaremos de novedades y ofertas. Y si dejas una pieza en el
                carrito, te la recordaremos para que no se te escape.
              </p>
            </>
          ) : (
            <>
              <h2>Únete a la familia</h2>
              <p>
                Suscríbete y recibe novedades, ofertas y el aviso si dejas tu
                pieza en el carrito.
              </p>
              <div className="subscribe-form-group">
                <form className="subscribe-form" onSubmit={submit}>
                  <input
                    autoComplete="email"
                    type="email"
                    name="email"
                    placeholder="Escribe tu correo"
                    required
                  />
                  <button type="submit">Suscribirme</button>
                </form>
              </div>
              <div className="subscribe-bottom">
                <input
                  type="checkbox"
                  id="newsletter-permission"
                  checked={dontShow}
                  onChange={(e) => setDontShow(e.target.checked)}
                />
                <label htmlFor="newsletter-permission">No volver a mostrar</label>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
