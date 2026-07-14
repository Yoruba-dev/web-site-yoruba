"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { subscribeToMarketing } from "@/lib/subscribe";

// The footer newsletter form. Captures the email into the cart context so the
// site can hand the cart to Shopify (with the email) for abandoned-cart recovery.
export default function NewsletterInline() {
  const { setEmail } = useCart();
  const [sent, setSent] = useState(false);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get("email");
    const address = typeof value === "string" ? value.trim() : "";
    if (!address) return;
    setEmail(address);
    subscribeToMarketing(address);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="widget-short_desc">
        <p>¡Gracias! ✦ Te mantendremos al tanto de novedades y ofertas.</p>
      </div>
    );
  }

  return (
    <div className="newsletter-form_wrap">
      <form className="subscribe-form" onSubmit={submit}>
        <input
          className="newsletter-input"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Escribe tu correo"
          required
        />
        <button className="newsletter-btn" type="submit">
          <i className="ion-android-mail" />
        </button>
      </form>
    </div>
  );
}
