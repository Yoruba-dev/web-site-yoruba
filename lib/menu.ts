// Navigation model. Cleaned up per the store's chosen layouts:
//   • Shop  → the Left Sidebar catalogue (/shop-left-sidebar)
//   • Product pages → Tab Style Left (handled by the product route)
// The demo layout variants still exist as routes, just not in the menu.

export interface MenuLink {
  label: string;
  href: string;
}

export interface MenuColumn {
  title: string;
  links: MenuLink[];
}

export interface MenuItem {
  label: string;
  href: string;
  dropdown?: MenuLink[];
  megaColumns?: MenuColumn[];
}

export const MAIN_MENU: MenuItem[] = [
  { label: "Inicio", href: "/" },
  { label: "Tienda", href: "/shop-left-sidebar" },
  {
    label: "Páginas",
    href: "/my-account",
    dropdown: [
      { label: "Mi cuenta", href: "/my-account" },
      { label: "Iniciar sesión", href: "/login-register" },
      { label: "Lista de deseos", href: "/wishlist" },
      { label: "Carrito", href: "/cart" },
      { label: "Pago", href: "/checkout" },
      { label: "Comparar", href: "/compare" },
      { label: "Preguntas frecuentes", href: "/faq" },
    ],
  },
  { label: "Diario", href: "/blog" },
  { label: "Nosotros", href: "/about-us" },
  { label: "Contacto", href: "/contact" },
];

// "Shop by categories" list (kept for reference / future use).
export const CATEGORIES: string[] = [
  "Rings",
  "Necklaces",
  "Earrings",
  "Bracelets",
  "Pendants",
  "Anklets",
];
