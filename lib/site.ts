// Single source of truth for brand + contact details. Everything in the header,
// footer and contact page reads from here — never hardcode contact info in a
// component. Values are the real Pedro Yoruba Jewelry business details.

// Canonical site origin — every schema.org/JSON-LD absolute URL and the
// sitemap/robots files read this instead of redefining the fallback string.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://pedrojewelryyoruba.com";

// Default social-share image. Next REPLACES (not merges) the openGraph object,
// so any page that sets its own `openGraph` must spread this in or it ships no
// image → blank thumbnail on WhatsApp/Facebook/etc. Spread as `images: OG_IMAGE`.
export const OG_IMAGE = [
  { url: "/og-image.png", width: 1200, height: 630, alt: "Pedro Yoruba Jewelry" },
];

// Handle of the piece featured in the home "Oferta destacada" banner. The banner
// only appears when THIS product is on sale (i.e. has a real compareAtPrice > price
// in Shopify) — so the promo turns itself off when the sale ends, and turns on for
// a new product simply by putting that product on sale and changing this handle.
export const FEATURED_OFFER_HANDLE = "pulsos-de-yemaya";

export const SITE = {
  name: "Pedro Yoruba Jewelry",
  tagline:
    "Joyería Yoruba de lujo, hecha a mano en Miami. Oro 10k · 14k · 18k para los Orishas — piezas únicas por encargo, donde la fe se lleva puesta.",
  // Owner's logo, background removed → transparent PNG (in /public/assets/images/logo).
  logo: {
    main: "/assets/images/logo/pedro-yoruba-transparent.png",
    sticky: "/assets/images/logo/pedro-yoruba-transparent.png",
    footer: "/assets/images/logo/pedro-yoruba-transparent.png",
  },
  contact: {
    phone: "(305) 522-8490", // principal (también WhatsApp)
    phoneTel: "+13055228490", // formato para enlaces tel:
    phoneAlt: "(305) 901-9377", // segundo número / chat
    phoneAltTel: "+13059019377",
    whatsapp: "https://wa.me/13055228490",
    email: "pedro.yoruba.jewelry16@gmail.com",
    address: "11865 SW 26th St. c-41, Miami, FL 33175",
    mapQuery: "11865 SW 26th St c-41, Miami, FL 33175",
    geo: { lat: 25.7477721, lng: -80.3897371 },
  },
  // Business hours (open days/times). Sunday closed.
  hours: [
    { day: "Lunes", value: "10:00 AM – 5:00 PM" },
    { day: "Martes", value: "10:00 AM – 5:00 PM" },
    { day: "Miércoles", value: "10:00 AM – 5:00 PM" },
    { day: "Jueves", value: "10:00 AM – 5:00 PM" },
    { day: "Viernes", value: "10:00 AM – 5:00 PM" },
    { day: "Sábado", value: "10:00 AM – 4:00 PM" },
    { day: "Domingo", value: "Cerrado" },
  ],
  // Only the social accounts the business actually has.
  social: {
    instagram: "https://www.instagram.com/pedroyorubajewelry/",
    facebook: "https://www.facebook.com/profile.php?id=100083098098837",
    tiktok: "https://www.tiktok.com/@pedro_joyero_olofin",
  },
  // Google Analytics 4 measurement ID.
  analytics: { gaId: "G-YRQD06WQYY" },
  // ---------------------------------------------------------------------------
  // Home hero. ONE fixed background (the smoke/incense plate) stays put while the
  // carousel cycles the CONTENT on top of it — so the copy is real HTML (readable,
  // responsive, indexable) instead of text baked into a flat banner image.
  // ---------------------------------------------------------------------------
  /**
   * Hero carousel, COMPOSED FROM LAYERS instead of flat pre-baked banners:
   *   `bg`  — the scene (smoke / velvet / light), a JPEG background layer
   *   `art` — the piece, cut out with a transparent edge (WebP)
   *   copy  — real HTML text, never pixels
   * Slides crossfade; they never slide sideways.
   *
   * Why layered: the headline stays razor-sharp at any size, reflows on phones
   * (baked-in text just shrinks until it's unreadable), is indexable by Google,
   * and can be reworded without re-exporting artwork. Each layer also weighs a
   * fraction of a full composite. Masters live in design-assets/hero-originales/.
   */
  // artW = width as a % of the stage; artTop = vertical position. There is no
  // horizontal knob on purpose: the piece is always seated flush against the
  // frame edge opposite the copy (see .pyj-hero_art in globals.css).
  heroSlides: [
    {
      bg: "/assets/images/hero/capas/fondo-centrado-variante.jpg",
      art: "/assets/images/hero/capas/arte-pulso-anillo.webp",
      artW: "46%",
      artTop: "34.7%",
      artAlt: "Pulso de Orula en oro con cuentas verdes y amarillas junto a un anillo de sello",
      title: "Joyería Yoruba hecha a mano en Miami",
      text: "Oro 10k · 14k · 18k — donde la fe se lleva puesta",
      cta: "Ver la colección",
      href: "/shop-left-sidebar",
      align: "left",
    },
    {
      bg: "/assets/images/hero/capas/fondo-diseno-personalizado.jpg",
      art: "/assets/images/hero/capas/arte-boceto.webp",
      artW: "48%",
      artTop: "7.7%",
      artAlt: "Boceto a mano de un anillo de sello junto a gemas sueltas de colores",
      title: "Diseña tu pieza a la medida",
      text: "Anillos e Idde personalizados, hechos a mano según tu santo y tu estilo",
      cta: "Diseña tu pieza",
      href: "/configurador",
      align: "left",
    },
    {
      bg: "/assets/images/hero/capas/fondo-herramientas-santo.jpg",
      art: "/assets/images/hero/capas/arte-herramientas.webp",
      artW: "50%",
      artTop: "15.9%",
      artAlt: "Herramientas de fundamento en oro y plata: remos, hacha, yunque, martillo y caracoles",
      title: "Herramientas de cada Oricha",
      text: "Piezas de fundamento para tu Ocha e Ifá — garantía de por vida",
      cta: "Ver herramientas",
      href: "/collections/herramientas",
      align: "left",
    },
    {
      bg: "/assets/images/hero/capas/fondo-mano-variante.jpg",
      art: "/assets/images/hero/capas/arte-mano-idde.webp",
      artW: "48%",
      artTop: "24.0%",
      artAlt: "Mano con anillo martillado en oro y pulsos de Orula en la muñeca",
      title: "Diseña tu Idde de Orula",
      text: "Piezas de fundamento, hechas a la medida de tu santo",
      cta: "Ver los iddes",
      href: "/collections/idde",
      align: "right",
    },
    {
      bg: "/assets/images/hero/capas/fondo-collar-variante.jpg",
      art: "/assets/images/hero/capas/arte-collar.webp",
      artW: "44%",
      artTop: "21.1%",
      artAlt: "Collar de cuentas de santo con entrepiezas y medalla en oro",
      title: "Collares y elekes de santo",
      text: "Cuentas y oro, montados a mano pieza por pieza",
      cta: "Ver los collares",
      href: "/collections/collares-de-santos",
      align: "left",
    },
    {
      bg: "/assets/images/hero/capas/fondo-hero-oro.jpg",
      art: "/assets/images/hero/capas/arte-pulso-angulo.webp",
      artW: "43%",
      artTop: "30.7%",
      artAlt: "Pulso de eslabones en oro junto a un anillo de sello",
      title: "Pulsos y pulseras en oro",
      text: "Semanarios, esclavas y pulsos de santo en 10k · 14k · 18k",
      cta: "Ver pulsos y pulseras",
      href: "/collections/pulsos-y-pulseras",
      align: "right",
    },
    {
      bg: "/assets/images/hero/capas/fondo-humo-verde-dorado.jpg",
      art: "/assets/images/hero/capas/arte-mano-anillo.webp",
      artW: "44%",
      artTop: "16.6%",
      artAlt: "Mano con un anillo de sello en oro y un pulso a juego",
      title: "Anillos de sello y de santo",
      text: "Hechos a mano, a tu talla y con el sello que tú elijas",
      cta: "Ver los anillos",
      href: "/collections/anillos",
      align: "left",
    },
  ],
} as const;
