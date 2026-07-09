"use client";

import { useState } from "react";
import { SITE } from "@/lib/site";

const faqs = [
  {
    id: "One",
    question: "¿Dónde están ubicados?",
    answer: `Estamos en ${SITE.contact.address}. Puedes visitarnos, recoger tu pedido o escribirnos por WhatsApp al ${SITE.contact.phone}.`,
  },
  {
    id: "Two",
    question: "¿Cuál es el horario de atención?",
    answer:
      "Lunes a viernes de 10:00 AM a 5:00 PM, sábados de 10:00 AM a 4:00 PM, y domingos cerrado.",
  },
  {
    id: "Three",
    question: "¿Necesito cita para visitarlos?",
    answer: `Sí, te recomendamos agendar una cita para atenderte mejor. Escríbenos por WhatsApp al ${SITE.contact.phone} y coordinamos el día y la hora.`,
  },
  {
    id: "Four",
    question: "¿Hacen piezas por encargo o personalizadas?",
    answer:
      "Sí. La mayoría de nuestras piezas —Idde, herramientas, anillos, esclavas y más— se hacen por encargo, a tu medida y a la de tu santo. Cuéntanos lo que buscas y lo diseñamos para ti.",
  },
  {
    id: "Five",
    question: "¿Con qué quilates de oro trabajan?",
    answer:
      "Trabajamos oro de 10k, 14k y 18k. En cada pieza te indicamos el quilataje y te asesoramos según tu presupuesto y preferencia.",
  },
  {
    id: "Six",
    question: "¿Qué formas de pago aceptan?",
    answer:
      "Aceptamos tarjetas VISA, MasterCard, American Express y Discover, tarjetas de débito y pagos móviles sin contacto (NFC). No aceptamos cheques.",
  },
  {
    id: "Seven",
    question: "¿Ofrecen reparación de joyas?",
    answer:
      "Sí, ofrecemos servicios de reparación. Tráenos tu pieza o escríbenos por WhatsApp para revisarla y darte un estimado.",
  },
  {
    id: "Eight",
    question: "¿Puedo recoger mi pedido o hacen envíos?",
    answer:
      "Puedes recoger tu pedido en la tienda o en la puerta (curbside), y también ofrecemos entrega a domicilio. Coordinamos contigo la mejor opción.",
  },
  {
    id: "Nine",
    question: "¿Cuánto tarda una pieza por encargo?",
    answer:
      "Depende de la pieza y del diseño; algunos encargos toman alrededor de un mes. Escríbenos por WhatsApp y te damos un tiempo estimado según lo que necesites.",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="frequently-accordion">
      <div id="accordion">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={faq.id} className={isOpen ? "card actives" : "card"}>
              <div className="card-header" id={`heading${faq.id}`}>
                <h5 className="mb-0">
                  <a
                    href="#"
                    className={isOpen ? "" : "collapsed"}
                    aria-expanded={isOpen}
                    aria-controls={`collapse${faq.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenIndex(isOpen ? -1 : index);
                    }}
                  >
                    {faq.question}
                  </a>
                </h5>
              </div>
              <div
                id={`collapse${faq.id}`}
                className={isOpen ? "collapse show" : "collapse"}
                aria-labelledby={`heading${faq.id}`}
              >
                <div className="card-body">{faq.answer}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
