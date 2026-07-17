import { SITE } from "./site";

// The store's FAQ — single source of truth, rendered by FaqAccordion (visible
// accordion) AND serialized as schema.org FAQPage JSON-LD on /faq so Google
// and AI answer engines can quote the answers directly.
export const FAQS = [
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
      "Sí, tenemos taller propio: cambio de medida, soldadura de cadenas, reengaste de piedras, pulido, baño de rodio y limpieza. Tráenos tu pieza o escríbenos por WhatsApp; te damos un presupuesto por escrito antes de trabajar. Ver más en Garantía y devoluciones.",
  },
  {
    id: "Return",
    question: "¿Aceptan devoluciones o cambios?",
    answer:
      "No. Todas las ventas son finales: no aceptamos devoluciones, reembolsos ni cambios, porque la joyería va en contacto con la piel y muchas piezas son religiosas o hechas por encargo. Sí respaldamos cada pieza con garantía de por vida contra defectos de fabricación. Detalles en la página de Garantía y devoluciones.",
  },
  {
    id: "Warranty",
    question: "¿Qué garantía tienen las piezas?",
    answer:
      "Garantía de por vida contra defectos de fabricación (fallas de mano de obra o material), mientras el comprador original conserve la pieza y su comprobante. No cubre el desgaste normal, golpes, daño por químicos ni trabajos de terceros. Si una pieza es irreparable, la reemplazamos por otra de valor similar.",
  },
  {
    id: "Herramientas",
    question: "¿Qué son las herramientas de santo o herramientas yoruba?",
    answer:
      "Son los objetos metálicos que representan el poder de cada Orisha y forman parte del trono de quien se corona en la Regla de Ocha. Las hacemos en acero inoxidable y en oro por encargo — ver la colección de Herramientas y nuestra guía ¿Qué son las herramientas de santo?",
  },
  {
    id: "Idde",
    question: "¿Qué es el Idde y dónde lo consigo en Miami?",
    answer:
      "El Idde de Orula es la pulsera sagrada de quien se acerca a Ifá, hecha en oro o plata a tu medida. Lo fabricamos en nuestro taller de Miami — ver la colección de Idde y la guía ¿Qué es el Idde de Orula?",
  },
  {
    id: "Monedas",
    question: "¿Qué significan las monedas de plata en la santería?",
    answer:
      "Se llevan tradicionalmente como símbolo de protección y prosperidad, en dije, pulsera o collar. Ver la colección de Monedas de plata y nuestro artículo del Diario sobre su significado.",
  },
  {
    id: "Mayoreo",
    question: "¿Venden al por mayor a botánicas?",
    answer:
      "Sí. Vendemos herramientas de santo, monedas, Idde y otras piezas al por mayor a botánicas y tiendas religiosas en todo Estados Unidos — ver Mayorista · Botánicas.",
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
] as const;
