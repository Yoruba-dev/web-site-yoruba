import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/layout/Breadcrumb";
import StoreMap from "@/components/layout/StoreMap";
import SocialLinks from "@/components/layout/SocialLinks";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "La historia de Pedro Yoruba Jewelry: joyería Yoruba hecha a mano en Miami, con devoción a los Orishas. Oro 10k, 14k y 18k por encargo — Idde, elekes, herramientas y atributos.",
};

const values = [
  {
    title: "Hecho a mano",
    text: "Cada pieza se elabora a mano en nuestro taller de Miami, con paciencia y cuidado.",
  },
  {
    title: "Oro de verdad",
    text: "Trabajamos oro de 10k, 14k y 18k — calidad que perdura y se hereda.",
  },
  {
    title: "Por encargo",
    text: "Diseñamos tu pieza única, a tu medida y a la de tu santo. Pieza por pieza.",
  },
  {
    title: "Con devoción",
    text: "Honramos la tradición Yoruba (Lucumí) con respeto en cada detalle.",
  },
];

export default function AboutUsPage() {
  return (
    <>
      <Breadcrumb title="Nosotros" crumbs={[{ label: "Nosotros" }]} />

      {/* Historia */}
      <div className="about-us-area">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 col-md-7">
              <div className="overview-content">
                <h2>
                  Donde la fe <span>se lleva puesta</span>
                </h2>
                <p className="short_desc">
                  Pedro Yoruba Jewelry nació de una verdad sencilla: la fe también se
                  lleva puesta. En un taller de Miami, cada joya se hace a mano, con
                  paciencia y devoción. No son solo adornos —son <strong>Idde, elekes,
                  herramientas y atributos de los Orishas</strong>: oro de 10k, 14k y 18k
                  trabajado con el respeto que la religión Yoruba (Lucumí) merece.
                </p>
                <p className="short_desc">
                  Detrás de cada encargo hay horas de trabajo, sacrificio y amor. Amor por
                  el oficio de joyero, y amor por la tradición que da sentido a cada pieza.
                  Para nosotros una joya no es un lujo vacío: es un compromiso con Olodumare
                  y los Orishas, un símbolo de fe que acompaña a quien la lleva.
                </p>
                <p className="short_desc">
                  Trabajamos <strong>por encargo</strong>, pieza por pieza, para que cada
                  joya sea tan única como la persona y el santo al que honra. Ese es nuestro
                  orgullo: cuidar cada detalle como si fuera para nuestra propia familia de
                  religión. Gracias por confiar en nosotros para llevar tu fe en oro.
                </p>
                <div className="hiraola-about-us_btn-area">
                  <Link className="about-us_btn" href="/shop-left-sidebar">
                    Ver la colección
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-md-5">
              <div className="overview-img text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="img-full"
                  src={SITE.logo.main}
                  alt={`${SITE.name} — joyería Yoruba hecha a mano en Miami`}
                  style={{ maxWidth: 320, margin: "0 auto" }}
                />
              </div>
            </div>
          </div>

          {/* Valores */}
          <div className="row about-values" style={{ marginTop: 40 }}>
            {values.map((v) => (
              <div className="col-lg-3 col-md-6" key={v.title}>
                <div
                  style={{
                    borderRadius: 12,
                    padding: "26px 22px",
                    height: "100%",
                    background: "var(--dk-surface)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{ color: "var(--pyj-gold)", fontSize: 26, marginBottom: 10 }}
                    aria-hidden="true"
                  >
                    ✦
                  </div>
                  <h5 style={{ color: "var(--dk-head)", marginBottom: 8 }}>{v.title}</h5>
                  <p style={{ color: "var(--dk-text)", fontSize: 14, margin: 0 }}>
                    {v.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visítanos */}
      <div className="about-us-area" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="hiraola-section_title" style={{ marginBottom: 24 }}>
            <h4>Visítanos</h4>
          </div>
          <div className="row align-items-center">
            <div className="col-lg-5">
              <div className="overview-content">
                <p className="short_desc">
                  <strong>{SITE.contact.address}</strong>
                </p>
                <ul style={{ listStyle: "none", padding: 0, marginBottom: 18 }}>
                  {SITE.hours.map((h) => (
                    <li
                      key={h.day}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        maxWidth: 300,
                        padding: "3px 0",
                        color: "var(--dk-text)",
                      }}
                    >
                      <span>{h.day}</span>
                      <span>{h.value}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={SITE.contact.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="about-us_btn"
                >
                  Escríbenos por WhatsApp
                </a>
                <SocialLinks />
              </div>
            </div>
            <div className="col-lg-7">
              <StoreMap height={360} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
