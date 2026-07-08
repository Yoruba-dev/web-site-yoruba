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
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop-left-sidebar" },
  { label: "Blog", href: "/blog-left-sidebar" },
  {
    label: "Pages",
    href: "/my-account",
    dropdown: [
      { label: "My Account", href: "/my-account" },
      { label: "Login | Register", href: "/login-register" },
      { label: "Wishlist", href: "/wishlist" },
      { label: "Cart", href: "/cart" },
      { label: "Checkout", href: "/checkout" },
      { label: "Compare", href: "/compare" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  { label: "About Us", href: "/about-us" },
  { label: "Contact", href: "/contact" },
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
