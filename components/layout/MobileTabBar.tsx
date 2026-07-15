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
  const { count, setCartOpen, cartOpen } = useCart();
  const { count: wishCount } = useWishlist();

  // While the cart drawer is open, IT is the active surface — don't also light a
  // route tab (that reads as two selected tabs). Route tabs glow only when the
  // cart is closed.
  const isHome = !cartOpen && pathname === "/";
  const isShop =
    !cartOpen &&
    (pathname.startsWith("/shop") || pathname.startsWith("/collections"));
  const isWish = !cartOpen && pathname.startsWith("/wishlist");
  const isAccount =
    !cartOpen &&
    (pathname.startsWith("/my-account") || pathname.startsWith("/login"));

  // Tapping any route tab must dismiss the cart — even when the tab points at the
  // current route (Next.js does no navigation then, so the pathname effect that
  // normally closes the cart never fires). Calling this is idempotent.
  const closeCart = () => setCartOpen(false);

  return (
    <nav className="pyj-tabbar" aria-label="Navegación principal">
      <Link
        href="/"
        onClick={closeCart}
        className={`pyj-tab${isHome ? " is-active" : ""}`}
      >
        <i className="ion-ios-home" aria-hidden="true" />
        <span>Inicio</span>
      </Link>

      <Link
        href="/shop-left-sidebar"
        onClick={closeCart}
        className={`pyj-tab${isShop ? " is-active" : ""}`}
      >
        <i className="ion-ios-search-strong" aria-hidden="true" />
        <span>Tienda</span>
      </Link>

      <Link
        href="/wishlist"
        onClick={closeCart}
        className={`pyj-tab${isWish ? " is-active" : ""}`}
      >
        <span className="pyj-tab-ico">
          <i className="ion-ios-heart" aria-hidden="true" />
          {wishCount > 0 && <span className="pyj-tab-badge">{wishCount}</span>}
        </span>
        <span>Favoritos</span>
      </Link>

      <button
        type="button"
        className={`pyj-tab${cartOpen ? " is-active" : ""}`}
        onClick={() => setCartOpen(!cartOpen)}
      >
        <span className="pyj-tab-ico">
          <i className="ion-bag" aria-hidden="true" />
          {count > 0 && <span className="pyj-tab-badge">{count}</span>}
        </span>
        <span>Carrito</span>
      </button>

      <Link
        href="/my-account"
        onClick={closeCart}
        className={`pyj-tab${isAccount ? " is-active" : ""}`}
      >
        <i className="ion-ios-person" aria-hidden="true" />
        <span>Cuenta</span>
      </Link>
    </nav>
  );
}
