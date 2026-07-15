import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import FaqAccordion from "@/components/faq/FaqAccordion";
import JsonLd from "@/components/seo/JsonLd";
import { FAQS } from "@/lib/faq-data";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Ubicación, horario, citas, piezas por encargo, quilates de oro, formas de pago, reparaciones y envíos de Pedro Yoruba Jewelry en Miami.",
  // Without this the page inherits the layout's canonical ("/") and search
  // engines consolidate the FAQ into the home — losing the FAQPage rich result.
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  // schema.org FAQPage — makes the Q&A eligible for rich results and lets AI
  // answer engines (ChatGPT, Perplexity, AI Overviews) quote answers directly.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <>
      <JsonLd data={faqSchema} />
      <Breadcrumb
        title="Preguntas frecuentes"
        crumbs={[{ label: "Preguntas frecuentes" }]}
      />
      {/* Begin Hiraola's Frequently Area */}
      <div className="frequently-area">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="frequently-content">
                <div className="frequently-desc">
                  <h3>
                    Aquí respondemos las preguntas más comunes. Si no encuentras lo que
                    buscas, escríbenos por WhatsApp.
                  </h3>
                  <p>
                    Somos una joyería Yoruba hecha a mano en Miami: Idde, elekes,
                    herramientas y atributos de los Orishas en oro de 10k, 14k y 18k, la
                    mayoría por encargo. Con gusto te asesoramos en tu pieza.
                  </p>
                </div>
              </div>
              <FaqAccordion />
            </div>
          </div>
        </div>
      </div>
      {/* Hiraola's Frequently Area End Here */}
    </>
  );
}
