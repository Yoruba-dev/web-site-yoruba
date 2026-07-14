"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";

// App-style bottom navigation for phones/tablets — a frosted-glass bar fixed to
// the bottom, always visible (like a native iOS tab bar). Hidden on desktop,
// where the top nav does the job.
export default function MobileTabBar() {
  const pathname = usePathname();
  const { count, setCartOpen } = useCart();
  const { count: wishCount } = useWishlist();

  const isHome = pathname === "/";
  const isShop = pathname.startsWith("/shop") || pathname.startsWith("/collections");
  const isWish = pathname.startsWith("/wishlist");
  const isAccount =
    pathname.startsWith("/my-account") || pathname.startsWith("/login");

  return (
    <nav className="pyj-tabbar" aria-label="Navegación principal">
      <Link href="/" className={`pyj-tab${isHome ? " is-active" : ""}`}>
        <i className="ion-ios-home" aria-hidden="true" />
        <span>Inicio</span>
      </Link>

      <Link
        href="/shop-left-sidebar"
        className={`pyj-tab${isShop ? " is-active" : ""}`}
      >
        <i className="ion-ios-search-strong" aria-hidden="true" />
        <span>Tienda</span>
      </Link>

      <Link href="/wishlist" className={`pyj-tab${isWish ? " is-active" : ""}`}>
        <span className="pyj-tab-ico">
          <i className="ion-ios-heart" aria-hidden="true" />
          {wishCount > 0 && <span className="pyj-tab-badge">{wishCount}</span>}
        </span>
        <span>Favoritos</span>
      </Link>

      <button type="button" className="pyj-tab" onClick={() => setCartOpen(true)}>
        <span className="pyj-tab-ico">
          <i className="ion-bag" aria-hidden="true" />
          {count > 0 && <span className="pyj-tab-badge">{count}</span>}
        </span>
        <span>Carrito</span>
      </button>

      <Link
        href="/my-account"
        className={`pyj-tab${isAccount ? " is-active" : ""}`}
      >
        <i className="ion-ios-person" aria-hidden="true" />
        <span>Cuenta</span>
      </Link>
    </nav>
  );
}
