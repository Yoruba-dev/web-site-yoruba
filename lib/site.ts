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
// Breadcrumb backdrop for the shop pages. Named on purpose: these pages used to
// read SITE.heroSlides[1].bg, so re-ordering the carousel silently changed an
// unrelated page's artwork. This is the only full-size scene still shipped — the
// hero's own scenes are phone-only now and encoded small to match.
export const BREADCRUMB_IMAGE = "/assets/images/hero/capas/fondo-diseno-personalizado.jpg";

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
  // Home hero — TWO RENDITIONS OF THE SAME SLIDE, one per breakpoint.
  // ---------------------------------------------------------------------------
  /**
   * DESKTOP (>=768px) shows `banner`: the owner's fully composed 1376x768 artwork
   * with the headline already set in it. That is what he designed and signed off,
   * and no HTML reconstruction matches its typography or registration. He exports
   * these deliberately WITHOUT the button ("sinboton") so the CTA is a real
   * <Link> — placed per slide at `ctaTop`/`ctaX`, measured to land just under the
   * gold rule the artwork leaves for it.
   *
   * PHONES (<768px) cannot use those: a 1376px-wide banner shown at 375px puts the
   * headline at ~10px tall and the subline at ~7px — unreadable, and invisible to
   * Google. So phones compose the slide instead: `bg` (the scene) + `art` (the
   * piece, cut out) + the copy as real HTML.
   *
   * `title`/`text` stay in the DOM at EVERY size. On phones they are what you see;
   * on desktop they are the accessible/indexable equivalent of the text baked into
   * the banner, and are visually hidden. They must keep saying exactly what the
   * banner says — if a banner is re-exported with new wording, change it here too,
   * or screen readers and Google get a different message than the eye does.
   *
   * <picture> picks ONE of the two by media query, so each visitor downloads only
   * their own rendition. Banners ship as AVIF + WebP at 828/1100/1376 (~59-78KB
   * AVIF at full width, from 1.0-1.4MB PNG masters, which stay out of public/).
   */
  heroSlides: [
    {
      banner: "hero-centrado",
      // frases que el arte original pinta en oro dentro del subtitulo
      oro: ["Oro 10k · 14k · 18k"],
      artAlt: "Pulso de Orula en oro con cuentas verdes y amarillas junto a un anillo de sello",
      title: "Joyería Yoruba hecha a mano en Miami",
      text: "Oro 10k · 14k · 18k — donde la fe se lleva puesta",
      cta: "Ver la colección",
      href: "/shop-left-sidebar",
      align: "left",
      // CTA anchored under the rule the artwork leaves empty for it
      ctaTop: "70%",
      ctaX: "6.8%",
    },
    {
      banner: "diseno-personalizado",
      // frases que el arte original pinta en oro dentro del subtitulo
      oro: ["Anillos e Idde"],
      artAlt: "Boceto a mano de un anillo de sello junto a gemas sueltas de colores",
      title: "Diseña tu pieza a la medida",
      text: "Anillos e Idde personalizados, hechos a mano según tu santo y tu estilo",
      cta: "Diseña tu pieza",
      href: "/configurador",
      align: "left",
      // CTA anchored under the rule the artwork leaves empty for it
      ctaTop: "70%",
      ctaX: "6.6%",
    },
    {
      banner: "herramientas",
      // frases que el arte original pinta en oro dentro del subtitulo
      oro: ["Ocha e Ifá", "por vida"],
      artAlt: "Herramientas de fundamento en oro y plata: remos, hacha, yunque, martillo y caracoles",
      title: "Herramientas de cada Oricha",
      text: "Piezas de fundamento para tu Ocha e Ifá — garantía de por vida",
      cta: "Ver herramientas",
      href: "/collections/herramientas",
      align: "left",
      // CTA anchored under the rule the artwork leaves empty for it
      ctaTop: "65%",
      ctaX: "5.8%",
    },
    {
      banner: "idde-orula",
      // frases que el arte original pinta en oro dentro del subtitulo
      oro: ["medida"],
      artAlt: "Mano con anillo martillado en oro y pulsos de Orula en la muñeca",
      title: "Diseña tu Idde de Orula",
      text: "Piezas de fundamento, hechas a la medida de tu santo",
      cta: "Ver los iddes",
      href: "/collections/idde",
      align: "right",
      // CTA anchored under the rule the artwork leaves empty for it
      ctaTop: "70%",
      ctaX: "4.9%",
    },
    {
      banner: "hero-collar",
      // frases que el arte original pinta en oro dentro del subtitulo
      oro: ["Oro 10k · 14k · 18k"],
      artAlt: "Collar de cuentas de santo con entrepiezas y medalla en oro",
      title: "Joyería Yoruba hecha a mano en Miami",
      text: "Oro 10k · 14k · 18k — donde la fe se lleva puesta",
      cta: "Ver los collares",
      href: "/collections/collares-de-santos",
      align: "left",
      // CTA anchored under the rule the artwork leaves empty for it
      ctaTop: "70%",
      ctaX: "6.7%",
    },
    {
      banner: "hero-oro",
      // frases que el arte original pinta en oro dentro del subtitulo
      oro: ["Oro 10k · 14k · 18k"],
      artAlt: "Pulso de eslabones en oro junto a un anillo de sello",
      title: "Joyería Yoruba hecha a mano en Miami",
      text: "Oro 10k · 14k · 18k — donde la fe se lleva puesta",
      cta: "Ver pulsos y pulseras",
      href: "/collections/pulsos-y-pulseras",
      align: "left",
      // CTA anchored under the rule the artwork leaves empty for it
      ctaTop: "70%",
      ctaX: "6.7%",
    },
    {
      banner: "hero-mano",
      // frases que el arte original pinta en oro dentro del subtitulo
      oro: ["Oro 10k · 14k · 18k"],
      artAlt: "Mano con un anillo de sello en oro y un pulso a juego",
      title: "Joyería Yoruba hecha a mano en Miami",
      text: "Oro 10k · 14k · 18k — donde la fe se lleva puesta",
      cta: "Ver los anillos",
      href: "/collections/anillos",
      align: "left",
      // CTA anchored under the rule the artwork leaves empty for it
      ctaTop: "70%",
      ctaX: "6.7%",
    },
  ],
} as const;
