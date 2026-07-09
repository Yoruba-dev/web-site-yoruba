import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ContactForm from "@/components/contact/ContactForm";
import SocialLinks from "@/components/layout/SocialLinks";
import StoreMap from "@/components/layout/StoreMap";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contacto",
  description: `Contáctanos: WhatsApp, teléfono, correo y nuestra tienda en ${SITE.contact.address}. Joyería Yoruba hecha a mano en Miami.`,
};

export default function ContactPage() {
  return (
    <>
      <Breadcrumb title="Contacto" crumbs={[{ label: "Contacto" }]} />
      {/* Begin Contact Main Page Area */}
      <div className="contact-main-page">
        <div className="container">
          <div id="google-map">
            <StoreMap height={420} />
          </div>
        </div>
        <div className="container">
          <div className="row">
            <div className="col-lg-5 offset-lg-1 col-md-12 order-1 order-lg-2">
              <div className="contact-page-side-content">
                <h3 className="contact-page-title">Contáctanos</h3>
                <p className="contact-page-message">
                  ¿Buscas una pieza por encargo o tienes una pregunta sobre tu Idde,
                  herramientas o joyas para los Orishas? Escríbenos por WhatsApp o
                  llámanos — con gusto te atendemos.
                </p>
                <a
                  href={SITE.contact.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="hiraola-btn"
                  style={{ display: "inline-block", marginBottom: 26 }}
                >
                  Escríbenos por WhatsApp
                </a>

                <div className="single-contact-block">
                  <h4>
                    <i className="fa fa-map-marker" /> Dirección
                  </h4>
                  <p>{SITE.contact.address}</p>
                </div>

                <div className="single-contact-block">
                  <h4>
                    <i className="fa fa-phone" /> Teléfono
                  </h4>
                  <p>
                    <a href={`tel:${SITE.contact.phoneTel}`}>{SITE.contact.phone}</a>
                  </p>
                  <p>
                    <a href={`tel:${SITE.contact.phoneAltTel}`}>{SITE.contact.phoneAlt}</a>
                  </p>
                </div>

                <div className="single-contact-block">
                  <h4>
                    <i className="fa fa-envelope" /> Correo
                  </h4>
                  <p>
                    <a href={`mailto:${SITE.contact.email}`}>{SITE.contact.email}</a>
                  </p>
                </div>

                <div className="single-contact-block last-child">
                  <h4>
                    <i className="fa fa-clock" /> Horario
                  </h4>
                  {SITE.hours.map((h) => (
                    <p
                      key={h.day}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        maxWidth: 280,
                        margin: "2px 0",
                      }}
                    >
                      <span>{h.day}</span>
                      <span>{h.value}</span>
                    </p>
                  ))}
                </div>

                <SocialLinks />
              </div>
            </div>
            <div className="col-lg-6 col-md-12 order-2 order-lg-1">
              <div className="contact-form-content">
                <h3 className="contact-page-title">Escríbenos un mensaje</h3>
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Contact Main Page Area End Here */}
    </>
  );
}
