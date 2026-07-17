import type { Block } from "./blog-data";

// SEO/GEO enrichment for /collections/[handle] — keyed by the real Shopify
// collection handle. Purely additive: a handle with no entry here renders
// exactly as before (generic title, raw Shopify description, no FAQ). The
// `intro` renders ABOVE the raw Shopify description (never replaces it) so
// an owner edit in Shopify admin keeps working.

export interface CollectionFaq {
  q: string;
  a: string;
}

export interface CollectionContent {
  seoTitle?: string;
  metaDescription?: string;
  /** Renders through the existing <ArticleBody> component. */
  intro?: Block[];
  /** Feeds a local FAQPage schema + a visible .pyj-guide_qa block. */
  faqs?: CollectionFaq[];
}

export const COLLECTION_CONTENT: Record<string, CollectionContent> = {
  // --- Tier 1: full treatment (the 3 terms the owner named) ---
  herramientas: {
    seoTitle: "Herramientas de Santo y Yoruba — Atributos de los Orishas | Colección",
    metaDescription:
      "Herramientas de santo (herramientas yoruba) en acero inoxidable con garantía de por vida y en oro por encargo: remos, muletas y atributos de cada Orisha. Hechas a mano en Miami — también al por mayor para botánicas.",
    intro: [
      {
        p: "Las **herramientas de santo** —también llamadas herramientas yoruba— son los objetos metálicos que representan la energía y los atributos de cada Orisha: el remo de Oshún, la muleta de San Lázaro (Babalú Ayé), el hacha de Changó, el ancla de Yemayá, entre otros. No son piezas decorativas: forman parte del **trono** y del fundamento de quien se corona en la Regla de Ocha, y acompañan al santero durante toda su vida religiosa.",
      },
      { h2: "¿En qué material se hacen?" },
      {
        p: "Las trabajamos en **acero inoxidable** —no se oxida ni pierde brillo, con garantía de por vida— y también **en oro por encargo**, a la medida del santo y del bolsillo de cada cliente. Todas se fabrican a mano en nuestro taller de Miami, pieza por pieza.",
      },
      { h2: "¿Para quién son?" },
      {
        p: "Están pensadas tanto para el santero que arma su propio trono como para las **botánicas** que las revenden a su clientela; si tienes una tienda religiosa, mira nuestra [página de mayoreo](/mayoreo). Puedes leer más sobre su significado en nuestra guía [¿Qué son las herramientas de santo?](/blog/herramientas-de-santo-que-son).",
      },
    ],
    faqs: [
      {
        q: "¿Qué son las herramientas de santo?",
        a: "Son los objetos metálicos —remos, muletas, hachas, arcos y demás atributos— que representan el poder de cada Orisha y forman parte del trono de quien se corona en la Regla de Ocha. No son adornos: son piezas rituales.",
      },
      {
        q: "¿En qué material se hacen las herramientas de los Orishas?",
        a: "En acero inoxidable con garantía de por vida (no se oxida) o en oro 10k, 14k y 18k por encargo. Ambas opciones se fabrican a mano en nuestro taller de Miami.",
      },
      {
        q: "¿Puedo comprar herramientas de santo al por mayor para mi botánica?",
        a: "Sí. Vendemos al por mayor a botánicas y tiendas religiosas en todo Estados Unidos — mira los detalles en nuestra página de mayoreo.",
      },
    ],
  },

  idde: {
    seoTitle: "Idde de Orula y de Ifá — Pulseras Sagradas | Colección",
    metaDescription:
      "Idde de Orula y de Ifá hechos a mano en Miami, en oro 10k, 14k, 18k y en plata. La pulsera sagrada de quien se acerca a Ifá — piezas por encargo con garantía de por vida.",
    intro: [
      {
        p: "El **Idde** (también escrito ide o iddé) es la pulsera de cuentas verdes y amarillas que recibe quien se acerca a Ifá — un **pacto** con Orunmila (Orula), el Oricha de la sabiduría, y una señal de protección y compromiso con esa senda. No es un accesorio: es un atributo religioso que se lleva de por vida.",
      },
      { h2: "Oro o plata" },
      {
        p: "Lo elaboramos en **oro 10k, 14k y 18k** —más duradero para el uso diario y con un valor que perdura— y también en **plata**, una opción más accesible que respeta igual los colores de Orula. Ambas se hacen a la medida de tu muñeca.",
      },
      {
        p: "Puedes leer la guía completa en [¿Qué es el Idde de Orula?](/blog/que-es-el-idde-de-orula), con su significado y en qué mano se lleva.",
      },
    ],
    faqs: [
      {
        q: "¿Qué es el Idde de Orula?",
        a: "Es la pulsera de cuentas verdes y amarillas que recibe quien se acerca a Ifá — un pacto de protección y compromiso con Orunmila (Orula), el Oricha de la sabiduría.",
      },
      {
        q: "¿En qué mano se lleva el Idde?",
        a: "Tradicionalmente en la muñeca izquierda, aunque la costumbre puede variar según la casa de santo — consúltalo siempre con tu padrino o madrina.",
      },
      {
        q: "¿Idde en oro o en plata: cuál elegir?",
        a: "El oro es más duradero para el uso diario y eleva la pieza a una joya de por vida; la plata es una opción más accesible que respeta igual los colores de Orula. Ambas se hacen a tu medida.",
      },
    ],
  },

  monedas: {
    seoTitle: "Monedas de Plata — Joyería de Moneda para la Santería | Colección",
    metaDescription:
      "Joyería de monedas de plata hecha a mano en Miami: dijes, pulseras y collares de moneda, símbolo tradicional de protección y prosperidad. También en oro por encargo.",
    intro: [
      {
        p: "La **moneda de plata** es uno de los símbolos más tradicionales de protección y prosperidad en la santería y en la cultura popular latina — se lleva como dije, como charm en una pulsera o como parte de un collar de monedas. Trabajamos la plata y también hacemos piezas en oro por encargo.",
      },
      { h2: "¿Por qué en plata?" },
      {
        p: "La plata es un metal noble, más accesible que el oro, y tradicionalmente asociada a la protección y la buena suerte — de ahí que la moneda de plata sea una de las piezas más pedidas para regalar o llevar puesta a diario. Si buscas la versión en oro, también la hacemos por encargo; compara los quilates en nuestra [guía de oro 10k, 14k o 18k](/blog/oro-10k-14k-18k-cual-elegir).",
      },
      {
        p: "Conoce más en nuestro artículo [Monedas de plata en la Santería: significado y cómo se llevan](/blog/monedas-de-plata-en-la-santeria).",
      },
    ],
    faqs: [
      {
        q: "¿Qué significan las monedas de plata en la santería?",
        a: "Se llevan tradicionalmente como símbolo de protección y prosperidad, en dije, pulsera o collar. Puedes leer el significado completo en nuestro artículo del Diario.",
      },
      {
        q: "¿Las monedas de plata se pueden llevar en collar o pulsera?",
        a: "Sí — las hacemos como dije colgante, como charm en una pulsera o como collar completo de monedas, según lo que prefieras.",
      },
      {
        q: "¿Por qué en plata y no en oro?",
        a: "La plata es más accesible y es el material tradicional para esta pieza; si prefieres oro, también la hacemos por encargo en 10k, 14k o 18k.",
      },
    ],
  },

  // --- Tier 2: short intro, weaves "accesorios" in as a secondary keyword ---
  azabache: {
    seoTitle: "Azabache — Accesorios de Protección para Bebé | Colección",
    metaDescription:
      "Azabaches para bebé en azabache y oro, hechos a mano en Miami — el accesorio tradicional de protección más pedido para recién nacidos.",
    intro: [
      {
        p: "El **azabache** es uno de los accesorios religiosos más tradicionales para proteger a un bebé recién nacido — una piedra negra engastada en oro que se lleva como pulsera o prendedor. Lo elaboramos a mano en nuestro taller de Miami.",
      },
    ],
  },
  "collares-de-santos": {
    seoTitle: "Collares de Santos — Elekes y Accesorios Religiosos | Colección",
    metaDescription:
      "Collares de los Santos (elekes) con los colores de cada Orisha, hechos a mano en Miami — el accesorio religioso central de la Regla de Ocha.",
    intro: [
      {
        p: "Los **collares de santos** (elekes) son el accesorio religioso más reconocible de la Regla de Ocha: cada color representa a un Orisha distinto. Conoce el significado de cada color en nuestra guía [Los colores de los Orishas y sus elekes](/blog/colores-de-los-orishas-y-sus-elekes).",
      },
    ],
  },
  "anillos-de-ifa": {
    seoTitle: "Anillos de Ifá — Accesorios y Joyería para Babalawos | Colección",
    metaDescription:
      "Anillos de Ifá en oro y plata, hechos a mano en Miami para babalawos e iniciados — un accesorio religioso tradicional de la práctica de Ifá.",
    intro: [
      {
        p: "Los **anillos de Ifá** son un accesorio tradicional para quienes practican Ifá, elaborados en oro y plata a la medida de cada cliente en nuestro taller de Miami.",
      },
    ],
  },
  "opeles-de-ifa": {
    seoTitle: "Opeles de Ifá — Cadena de Adivinación para Babalawo | Colección",
    metaDescription:
      "Opeles de Ifá en oro 10k, 14k, 18k y plata, hechos a mano en Miami — la cadena de adivinación tradicional del babalawo, un accesorio ceremonial de Ifá.",
    intro: [
      {
        p: "El **Opelé** es la cadena de adivinación que usa el babalawo en la práctica de Ifá — un accesorio ceremonial de ocho piezas que trabajamos en oro y en plata, a mano y por encargo, en nuestro taller de Miami.",
      },
    ],
  },

  // --- Tier 3: title/description only (cheap, mechanical win) ---
  "iddes-de-plata": {
    seoTitle: "Idde de Orula en Plata — Pulsera Sagrada | Colección",
    metaDescription:
      "Idde de Orula y de Ifá en plata 925, hecho a mano en Miami — una opción accesible que respeta los colores tradicionales de Orula.",
  },
  "herramientas-de-oshun": {
    seoTitle: "Herramientas de Oshún — Remos y Atributos | Colección",
    metaDescription:
      "Remos y atributos de Oshún en acero inoxidable y oro, hechos a mano en Miami para el trono de quien se corona con esta Orisha.",
  },
  "herramientas-de-santos-acero-inoxidable": {
    seoTitle: "Herramientas de Santo en Acero Inoxidable | Colección",
    metaDescription:
      "Herramientas de santo en acero inoxidable con garantía de por vida — no se oxidan ni pierden brillo. Hechas a mano en Miami, también al por mayor para botánicas.",
  },

  // yemaya, pulso-de-obbatala: no entry — untouched fallback.
};

export function getCollectionContent(handle: string): CollectionContent | undefined {
  return COLLECTION_CONTENT[handle];
}
