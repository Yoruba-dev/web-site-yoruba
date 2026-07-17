"use client";

import { SITE } from "@/lib/site";

// The store handles all customer contact through WhatsApp (the same channel as
// encargos and mayoreo). Shopify has no contact-form endpoint for a headless
// storefront (its /contact route 404s on this store), so instead of a form that
// silently goes nowhere, this hands off to WhatsApp with the message prefilled:
// the shopper fills the fields, hits Enviar, and their WhatsApp opens ready to
// send to the shop — a real, delivered message every time.
export default function ContactForm() {
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("con_name") ?? "").trim();
    const email = String(data.get("con_email") ?? "").trim();
    const subject = String(data.get("con_subject") ?? "").trim();
    const message = String(data.get("con_message") ?? "").trim();

    const text =
      `Hola 👋 Soy ${name}` +
      (email ? ` (${email})` : "") +
      (subject ? `\nAsunto: ${subject}` : "") +
      `\n\n${message}`;

    window.open(
      `${SITE.contact.whatsapp}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="contact-form">
      <form id="contact-form" onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="con_name">
            Tu nombre <span className="required">*</span>
          </label>
          <input type="text" id="con_name" name="con_name" required />
        </div>
        <div className="form-group">
          <label htmlFor="con_email">Tu correo</label>
          <input type="email" id="con_email" name="con_email" />
        </div>
        <div className="form-group">
          <label htmlFor="con_subject">Asunto</label>
          <input type="text" id="con_subject" name="con_subject" />
        </div>
        <div className="form-group form-group-2">
          <label htmlFor="con_message">Tu mensaje</label>
          <textarea id="con_message" name="con_message" required />
        </div>
        <div className="form-group">
          <button
            type="submit"
            id="submit"
            className="hiraola-contact-form_btn"
          >
            Enviar por WhatsApp
          </button>
        </div>
      </form>
      <p className="form-message mt-3 mb-0">
        Al enviar se abrirá WhatsApp con tu mensaje listo para mandarnos. También
        puedes llamarnos al{" "}
        <a href={`tel:${SITE.contact.phoneTel}`}>{SITE.contact.phone}</a>.
      </p>
    </div>
  );
}
