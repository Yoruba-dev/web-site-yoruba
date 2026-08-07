// ---------------------------------------------------------------------------
// Los servicios del taller, COMO DATOS. Una entrada por servicio y cada una es
// su propia página (/servicios/diseno, /servicios/grabado, …).
//
// Por qué páginas de verdad y no anclas dentro de una sola: esta sección
// respalda el registro de marca del dueño, y con una URL por servicio se puede
// entregar un enlace directo por cada uno —con su propio título, su propia
// descripción y su propio nodo Service de datos estructurados— en vez de pedir
// que alguien busque un ancla dentro de una página larga. Además el navegador
// guarda historial real, así que "Volver" devuelve a donde estabas.
//
// El cuerpo usa el mismo subconjunto de markdown que el Diario (**negrita** y
// [texto](/ruta)) y se pinta con <ArticleBody>, que ya existía — así el
// contenido son datos y no JSX incrustado.
// ---------------------------------------------------------------------------
import type { Block } from "./blog-data";

export interface WorkPhoto {
  /** URL del CDN de Shopify (la foto del producto). */
  src: string;
  /** Qué es la pieza — sale como pie de foto. */
  caption: string;
  alt: string;
  /** Handle del producto, para enlazar su ficha. */
  handle?: string;
}

export interface ServicePoint {
  head: string;
  /** Admite el mismo markdown que el cuerpo. */
  text: string;
}

export interface ServicePage {
  slug: string;
  /** Nombre corto — menú, pie, migas, tarjeta. */
  name: string;
  /** Nombre en inglés: se muestra como antetítulo y viaja como alternateName
   *  en el schema. Coincide con la redacción de las clases de la marca. */
  en: string;
  serviceType: string;
  /** Titular de la página. */
  heading: string;
  /** Resumen corto: tarjeta del índice Y description del Service. */
  summary: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  body: Block[];
  points: ServicePoint[];
  photos: WorkPhoto[];
  /** Foto de la tarjeta en el índice. */
  cover: WorkPhoto;
  /** Solo si el servicio es presencial (la autenticación se hace en mostrador). */
  areaServed?: { type: string; name: string };
}

const CDN = "https://cdn.shopify.com/s/files/1/0667/9475/0174";

// Fotos de trabajos REALES del taller. Cada una es una pieza del catálogo y
// lleva su handle, para que quien revise pueda abrir la ficha y comprobar que
// existe. Nada de bancos de imágenes.
const CORONA: WorkPhoto = {
  src: `${CDN}/files/20240527-160144.jpg?v=1716840430`,
  caption: "Corona en oro 10k, hecha a mano",
  alt: "Corona de oro 10k con piedras rojas, hecha a mano en el taller de Pedro Yoruba Jewelry",
  handle: "corona-👑10k",
};
const REMOS: WorkPhoto = {
  src: `${CDN}/files/20231019-155325.jpg?v=1697745909`,
  caption: "Remos de Oshún con el nombre grabado en el oro",
  alt: "Par de remos de Oshún en oro 10k con la palabra OSHUN grabada en la pala",
  handle: "remos-de-oshun-10k-juego-de-2",
};
const ANILLO_ORULA: WorkPhoto = {
  src: `${CDN}/files/20240205-113906.jpg?v=1707151625`,
  caption: "Anillo de Orula 10k",
  alt: "Anillo de Orula en oro de 10k con piedras, visto de cerca",
  handle: "anillo-de-orula-10k",
};
const IDDE_OSHUN: WorkPhoto = {
  src: `${CDN}/files/20230912-174229.jpg?v=1694555190`,
  caption: "Iddé de Oshún de lujo, 14k",
  alt: "Iddé de Oshún de lujo en oro de 14k",
  handle: "sin-nombre-12sept_17-44",
};

export const SERVICES: ServicePage[] = [
  {
    slug: "diseno",
    name: "Diseño de joyas",
    en: "Jewelry design",
    serviceType: "Diseño y fabricación de joyería personalizada",
    heading: "Diseño de joyas personalizadas",
    summary:
      "Piezas que no existen en catálogo, dibujadas contigo y hechas a mano en oro de 10k, 14k o 18k, plata 925 o acero inoxidable.",
    metaTitle: "Diseño de joyas personalizadas en Miami",
    metaDescription:
      "Diseñamos y fabricamos joyas a medida en oro 10k, 14k y 18k, plata 925 y acero: Idde, coronas, anillos de sello y piezas de diseño. Taller propio en Miami.",
    keywords: [
      "diseño de joyas miami",
      "joyería personalizada miami",
      "jewelry design miami",
      "custom jewelry design",
      "joyas hechas a medida",
      "taller de joyería miami",
    ],
    body: [
      {
        p: "Es el corazón del taller. Nos traes una idea —el Idde a la medida de tu santo, una corona, un anillo de sello, un dije que viste una vez y nadie te supo hacer— y la convertimos en una pieza real: definimos contigo el metal (oro de 10k, 14k o 18k, plata 925 o acero inoxidable), las medidas, las piedras y el acabado, te confirmamos el precio antes de empezar, y la fabricamos a mano.",
      },
      {
        p: "También puedes diseñar tú mismo desde la web: [el configurador de anillos de Ifá](/configurador) y [el de monedas](/configurador-monedas) te dejan colocar tus signos sobre la pieza real y pagar en línea. La orden llega al taller con la hoja de diseño exacta de lo que armaste — lo que apruebas es lo que se fabrica.",
      },
      {
        p: "¿Quieres ver cómo va un encargo de principio a fin? Lo contamos paso a paso en [cómo trabajamos](/servicios/como-trabajamos).",
      },
    ],
    points: [
      {
        head: "Piezas de la tradición Yoruba / Lucumí",
        text: "Idde de Orula, elekes, herramientas de santo, coronas y atributos de cada Oricha, hechos con respeto por la tradición.",
      },
      {
        head: "Diseño general",
        text: "Anillos de sello, dijes, cadenas y esclavas — el taller no se limita a la línea religiosa.",
      },
      {
        head: "Personalización real",
        text: "Color y piedras según tu santo, el animal que pidas tallado en la pieza, tu talla exacta.",
      },
    ],
    cover: CORONA,
    photos: [
      CORONA,
      {
        src: `${CDN}/files/20240527-161307.jpg?v=1716841013`,
        caption: "Corona de Oshún — Caridad del Cobre",
        alt: "Corona de oro calada para Oshún, Caridad del Cobre, hecha a mano",
        handle: "corona-👑-oshun-caridad-cobre",
      },
      {
        src: `${CDN}/files/Screenshot-20230908_174001_Shopify.jpg?v=1694209377`,
        caption: "Iddé personalizado, a la medida",
        alt: "Iddé de oro personalizado con medallones, hecho a la medida del cliente",
        handle: "sin-nombre-8sept_17-41",
      },
    ],
  },
  {
    slug: "grabado",
    name: "Grabado de joyas",
    en: "Jewelry engraving",
    serviceType: "Grabado de joyería",
    heading: "Grabado de joyas",
    summary:
      "Nombres, iniciales, fechas, signos de Ifá y otros motivos, grabados sobre las piezas que salen del taller — con el esquema exacto de tu diseño.",
    metaTitle: "Grabado de joyas: nombres, iniciales y signos de Ifá",
    metaDescription:
      "Grabamos nombres, iniciales, fechas y los signos de Ifá sobre el oro y la plata que salen de nuestro taller de Miami. Apruebas el esquema antes de grabar.",
    keywords: [
      "grabado de joyas",
      "grabado de nombres en joyas",
      "grabar nombre en anillo",
      "grabado de iniciales",
      "jewelry engraving miami",
      "jewelry name engraving",
    ],
    body: [
      {
        p: "Grabamos **nombres, iniciales y fechas** sobre el oro y la plata que salen del taller. También los **signos de Ifá** —los 16 Odù Meji, con sus torres izquierda y derecha tal como se escriben— y otros motivos. No trabajamos de memoria: ningún grabado se talla sin que apruebes antes el esquema exacto. Los pedidos hechos en los configuradores de la web llegan al taller con esa hoja de diseño ya generada.",
      },
      {
        p: "La pieza insignia es la **moneda de Ifá en plata 925**, de 36.5 mm, acuñada en el taller: el anverso lleva los 16 Odù Meji de fábrica y el reverso queda liso para tu signo — el grabado va incluido en el precio. Cada una lleva acuñado el sello **PYJ** del taller.",
      },
      {
        p: "¿Quieres grabar una pieza que no salió de aquí? Escríbenos primero con una foto: el grabado sobre piezas externas se evalúa caso a caso, según el metal y el estado de la pieza.",
      },
    ],
    points: [
      {
        head: "Nombres, iniciales y fechas",
        text: "Un nombre por dentro del aro, unas iniciales en la cara de un anillo de sello o la fecha que quieras recordar.",
      },
      {
        head: "Signos de Ifá",
        text: "El Odù completo o una torre, en el frente y los laterales de un anillo o en el reverso de la moneda.",
      },
      {
        head: "Diseño aprobado antes de tallar",
        text: "El esquema que apruebas es el plano que sigue el grabador.",
      },
      {
        head: "Diseña tu moneda",
        text: "Coloca tu signo sobre la moneda real y págala en la web — [abrir el configurador](/configurador-monedas).",
      },
    ],
    cover: REMOS,
    photos: [
      REMOS,
      {
        src: `${CDN}/files/099FC8A8-41AD-46DA-B25B-8146B5C417F8.jpg?v=1757362983`,
        caption: "Anillo de Ifá con los signos grabados",
        alt: "Anillo de Ifá en oro 10k con los signos grabados alrededor y piedras verdes",
        handle: "anillo-ifa-10k",
      },
      {
        src: `${CDN}/files/20231102-121534.jpg?v=1698942265`,
        caption: "Herramienta de Oshún — aldanes",
        alt: "Herramienta de Oshún en oro, aldanes, con inscripción grabada",
        handle: "herramientas-de-oshun",
      },
    ],
  },
  {
    slug: "autenticacion",
    name: "Autenticación de joyas",
    en: "Authenticating jewelry",
    serviceType: "Verificación y autenticación de joyería",
    heading: "Autenticación de joyas",
    summary:
      "Verificación del quilataje del oro y la ley de la plata, revisión de construcción e identificación de piezas de nuestro taller.",
    metaTitle: "Autenticación de joyas: verificamos oro y plata en Miami",
    metaDescription:
      "Verificamos el quilataje del oro (10k, 14k, 18k) y la ley de la plata 925, revisamos la construcción de la pieza e identificamos las nuestras. En tienda, en Miami.",
    keywords: [
      "autenticación de joyas",
      "jewelry authentication",
      "verificar oro miami",
      "comprobar quilates de oro",
      "saber si el oro es real",
    ],
    // Presencial: la pieza se revisa en el mostrador, no por correo.
    areaServed: { type: "City", name: "Miami" },
    body: [
      {
        p: "Trabajamos el oro y la plata todos los días, y eso nos permite decirte con fundamento qué tienes en la mano. Traes la pieza a la tienda y la revisamos contigo: verificamos el **quilataje del oro** (10k, 14k, 18k) y la **ley de la plata** (925), y examinamos la construcción —soldaduras, engastes, broches, huecos— para decirte qué es, cómo está hecha y en qué estado se encuentra.",
      },
      {
        p: "Si la pieza salió de nuestro taller, la identificamos: las monedas llevan el sello **PYJ** acuñado y los encargos quedan registrados con su pedido, así que podemos confirmar si una pieza es nuestra y cómo se hizo.",
      },
      {
        p: "Para ser claros: este servicio no incluye tasaciones para seguros ni certificados gemológicos de laboratorio. Si tu caso necesita uno, te decimos a quién acudir.",
      },
    ],
    points: [
      {
        head: "Verificación de metal",
        text: "Quilataje del oro y ley de la plata, verificados en el taller.",
      },
      {
        head: "Revisión de construcción",
        text: "Soldaduras, engastes y broches — qué tiene la pieza y en qué estado está.",
      },
      {
        head: "Piezas del taller",
        text: "Identificación por el sello PYJ y el registro del pedido.",
      },
    ],
    cover: ANILLO_ORULA,
    photos: [
      ANILLO_ORULA,
      {
        src: `${CDN}/files/20231010-172942.jpg?v=1696975382`,
        caption: "Iddé de Orula de lujo",
        alt: "Iddé de Orula de lujo en oro con cuentas verdes y amarillas",
        handle: "idde-de-orula-de-lujo-18",
      },
    ],
  },
  {
    slug: "consultoria",
    name: "Consultoría de diseño",
    en: "Jewelry design consulting service",
    serviceType: "Consultoría de diseño de joyería",
    heading: "Consultoría de diseño",
    summary:
      "Te ayudamos a decidir metal, medidas y piedras antes de encargar — y asesoramos a botánicas y tiendas que quieren línea propia.",
    metaTitle: "Consultoría de diseño de joyas antes de encargar",
    metaDescription:
      "Antes de encargar te asesoramos: qué quilate conviene, qué medidas tomar y qué piedras corresponden a tu santo. También surtido y línea propia para botánicas.",
    keywords: [
      "consultoría de diseño de joyas",
      "jewelry design consulting",
      "asesoría joyería miami",
      "qué quilate de oro elegir",
      "línea propia botánicas",
    ],
    body: [
      {
        p: "Una pieza de oro es una decisión de cientos o miles de dólares, y conviene tomarla con alguien que fabrica. Antes de encargar te ayudamos a decidir lo que de verdad cambia el resultado: qué quilate conviene según el uso y el presupuesto (el 10k, el 14k y el 18k no brillan ni pesan ni cuestan igual), qué medidas tomar, qué piedras corresponden a tu santo y cómo cuidar la pieza para que dure.",
      },
      {
        p: "También asesoramos a **negocios**: [botánicas y tiendas religiosas](/mayoreo) que arman su surtido o quieren una línea propia hecha en nuestro taller. La primera conversación —por WhatsApp o en la tienda— no cuesta nada.",
      },
    ],
    points: [
      {
        head: "Elegir el metal",
        text: "10k, 14k o 18k según uso, color y presupuesto — [lee nuestra guía de quilates](/blog/oro-10k-14k-18k-cual-elegir).",
      },
      {
        head: "Piedras según tu santo",
        text: "Los colores y gemas que corresponden a cada Oricha, aplicados a tu pieza.",
      },
      {
        head: "Para tiendas",
        text: "Surtido, reposición y línea propia para botánicas, con precio de mayorista.",
      },
    ],
    cover: IDDE_OSHUN,
    photos: [
      IDDE_OSHUN,
      {
        src: `${CDN}/files/20240205-112051.jpg?v=1707150334`,
        caption: "Anillo de Obbatalá 10k",
        alt: "Anillo de Obbatalá en oro de 10k",
        handle: "anillo-de-obbatala-10k",
      },
    ],
  },
];

export function getService(slug: string): ServicePage | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

/** El anterior y el siguiente, para navegar entre servicios sin volver al
 *  índice. Es circular: del último se pasa al primero. */
export function serviceNeighbours(slug: string) {
  const i = SERVICES.findIndex((s) => s.slug === slug);
  if (i < 0) return { prev: undefined, next: undefined };
  return {
    prev: SERVICES[(i - 1 + SERVICES.length) % SERVICES.length],
    next: SERVICES[(i + 1) % SERVICES.length],
  };
}

/** Galería del taller que cierra el índice — piezas que no salen en las fichas. */
export const WORKSHOP_PHOTOS: WorkPhoto[] = [
  {
    src: `${CDN}/products/20230125_135111.jpg?v=1674672889`,
    caption: "Muletas de San Lázaro",
    alt: "Muletas de San Lázaro en oro, hechas a mano",
    handle: "muletas-de-san-lazaro",
  },
  IDDE_OSHUN,
  {
    src: `${CDN}/files/20240205-112051.jpg?v=1707150334`,
    caption: "Anillo de Obbatalá 10k",
    alt: "Anillo de Obbatalá en oro de 10k",
    handle: "anillo-de-obbatala-10k",
  },
  {
    src: `${CDN}/files/20231012-174843.jpg?v=1697147674`,
    caption: "Iddé de Shangó 10k",
    alt: "Iddé de Shangó en oro de 10k con cuentas rojas y blancas",
    handle: "idde-de-shango-10k",
  },
];
