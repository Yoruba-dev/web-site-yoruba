"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-context";

const STORAGE_KEY = "hiraola_newsletter_dismissed";

// Appears 5s after load, dismissible. Captures the email into the cart context —
// which lets the site hand the cart to Shopify (with the email) for abandoned-cart
// recovery, and keeps the shopper on our mailing list.
export default function NewsletterPopup() {
  const { setEmail } = useCart();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [dontShow, setDontShow] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(t);
  }, []);

  function close() {
    if (dontShow || sent) localStorage.setItem(STORAGE_KEY, "1");
    setClosing(true);
    setTimeout(() => setVisible(false), 500);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get("email");
    const address = typeof value === "string" ? value.trim() : "";
    if (!address) return;
    setEmail(address); // → used for abandoned-cart recovery + mailing list
    setSent(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setTimeout(() => {
      setClosing(true);
      setTimeout(() => setVisible(false), 500);
    }, 2600);
  }

  if (!visible) return null;

  return (
    <div
      className="popup_wrapper"
      style={{
        opacity: closing ? 0 : 1,
        visibility: "visible",
        transition: "opacity 0.5s ease",
      }}
    >
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
