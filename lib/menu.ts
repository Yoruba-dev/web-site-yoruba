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
}

// Curated informational/landing pages shown in the "Páginas" mega menu.
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
      })),
    });
  }
  paginasColumns.push({ title: "Mi cuenta", links: ACCOUNT_LINKS });

  return [
    { label: "Inicio", href: "/" },
    { label: "Tienda", href: "/shop-left-sidebar" },
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
