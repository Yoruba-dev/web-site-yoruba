// Single source of truth for brand + contact details. Everything in the header,
// footer and contact page reads from here — never hardcode contact info in a
// component. Values are the real Pedro Yoruba Jewelry business details.

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
  // Home hero carousel — the banner images from the Shopify store's homepage
  // slideshow (Shopify admin › Content › Files). These are designed banners with
  // their own baked-in text, shown full-bleed (no overlay). To change the hero,
  // update these URLs or add/remove slides here — nothing else to touch.
  heroSlides: [
    {
      image:
        "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/BANNERS_NUEVOS_PEDRO.png?v=1742513250",
      alt: "Pedro Yoruba Jewelry — joyería Yoruba hecha a mano en Miami",
      href: "/shop-left-sidebar",
      width: 1640,
      height: 924,
    },
    {
      image:
        "https://cdn.shopify.com/s/files/1/0667/9475/0174/files/BANNERS_NUEVOS_PEDRO_1.png?v=1742563916",
      alt: "Piezas por encargo para los Orishas — oro 10k, 14k y 18k",
      href: "/shop-left-sidebar",
      width: 1640,
      height: 924,
    },
  ],
} as const;
