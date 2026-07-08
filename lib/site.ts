// Central place for brand + contact details.
// Populated as a DEMO from the live Pedro Yoruba Jewelry store
// (pedroyorubajewelry.myshopify.com). Update phone/email/address with the real
// values when ready — everything in the header/footer reads from here.

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
    // Not published on the store — placeholders, replace with the real details.
    phone: "+1 (000) 000 0000",
    email: "info@pedroyorubajewelry.com",
    address: "Miami, FL — USA",
  },
  social: {
    instagram: "https://www.instagram.com/pedroyorubajewelry",
    facebook: "https://www.facebook.com",
    twitter: "https://twitter.com",
    pinterest: "https://www.pinterest.com",
  },
} as const;
