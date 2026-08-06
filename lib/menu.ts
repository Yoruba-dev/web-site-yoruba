// Navigation model. Cleaned up per the store's chosen layouts:
//   • Shop  → the Left Sidebar catalogue (/shop-left-sidebar)
//   • Product pages → Tab Style Left (handled by the product route)
// The demo layout variants still exist as routes, just not in the menu.

export interface MenuLink {
  label: string;
  href: string;
  /** Optional thumbnail (used by the mobile menu's "Colecciones" list to show
   *  each collection's image next to its name). */
  image?: string;
}

export interface MenuColumn {
  title: string;
  links: MenuLink[];
  /** Optional extra class for the desktop mega-menu column (e.g. to flow a
   *  long list into two sub-columns). Ignored by the mobile menu. */
  className?: string;
}

export interface MenuItem {
  label: string;
  href: string;
  dropdown?: MenuLink[];
  megaColumns?: MenuColumn[];
  /** Render this item accented in gold (used for the Mayoreo B2B link). */
  highlight?: boolean;
}

// A live Shopify collection, as fed into the menu (from getCollections()).
export interface MenuCollection {
  handle: string;
  title: string;
  /** Collection image — shown as a thumbnail in the mobile menu. */
  image?: string;
}

// Los cuatro servicios del taller. Fuente única: la usan el desplegable de
// "Servicios" en la barra principal Y la columna del pie, así que los enlaces
// no pueden divergir entre menú y footer. Cada uno apunta a su ancla en
// /servicios, donde está la sección completa.
export const SERVICE_LINKS: MenuLink[] = [
  { label: "Diseño de joyas", href: "/servicios#diseno" },
  { label: "Grabado de joyas", href: "/servicios#grabado" },
  { label: "Autenticación de joyas", href: "/servicios#autenticacion" },
  { label: "Consultoría de diseño", href: "/servicios#consultoria" },
  { label: "Cómo trabajamos", href: "/servicios#proceso" },
  { label: "Diseña tu anillo de Ifá", href: "/configurador" },
  { label: "Diseña tu moneda de Ifá", href: "/configurador-monedas" },
];

// Curated informational/landing pages shown in the "Páginas" mega menu.
// Los servicios ya no viven aquí: tienen su propia entrada en la barra.
const GUIDE_LINKS: MenuLink[] = [
  { label: "Joyería en Miami", href: "/joyeria-en-miami" },
  { label: "Mayorista · Botánicas", href: "/mayoreo" },
  { label: "Garantía y devoluciones", href: "/garantia-y-devoluciones" },
  { label: "Preguntas frecuentes", href: "/faq" },
];

// Account / cart utility pages (kept together, out of the way of the guides).
const ACCOUNT_LINKS: MenuLink[] = [
  { label: "Mi cuenta", href: "/my-account" },
  { label: "Lista de deseos", href: "/wishlist" },
  { label: "Carrito", href: "/cart" },
  { label: "Pago", href: "/checkout" },
  { label: "Comparar", href: "/compare" },
];

/**
 * Build the main navigation. The "Páginas" item is a mega menu whose
 * "Colecciones" column is fed LIVE from Shopify (same source as the home
 * category carousel) — so category links never drift from the real store and
 * nothing is hardcoded. Pass an empty array (Shopify off / failed) and the
 * Colecciones column is simply omitted.
 */
export function buildMainMenu(collections: MenuCollection[] = []): MenuItem[] {
  const paginasColumns: MenuColumn[] = [{ title: "Guías", links: GUIDE_LINKS }];
  if (collections.length > 0) {
    paginasColumns.push({
      title: "Colecciones",
      className: "pyj-mega-collections",
      links: collections.map((c) => ({
        label: c.title,
        href: `/collections/${c.handle}`,
        image: c.image,
      })),
    });
  }
  paginasColumns.push({ title: "Mi cuenta", links: ACCOUNT_LINKS });

  return [
    { label: "Inicio", href: "/" },
    { label: "Tienda", href: "/shop-left-sidebar" },
    // Entrada propia en la barra, no escondida dentro de "Páginas": el taller
    // vende servicios además de producto, y tienen que verse.
    { label: "Servicios", href: "/servicios", dropdown: SERVICE_LINKS },
    { label: "Páginas", href: "/faq", megaColumns: paginasColumns },
    { label: "Diario", href: "/blog" },
    { label: "Nosotros", href: "/about-us" },
    { label: "Contacto", href: "/contact" },
  ];
}

// "Shop by categories" list (kept for reference / future use).
export const CATEGORIES: string[] = [
  "Rings",
  "Necklaces",
  "Earrings",
  "Bracelets",
  "Pendants",
  "Anklets",
];
