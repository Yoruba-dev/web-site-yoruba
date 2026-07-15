"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";

// App-style bottom navigation for phones/tablets — a frosted-glass bar fixed to
// the bottom (Liquid Glass), shown only ≤991px.
//
// The active highlight is ONE shared gold-glass pill (.pyj-tabbar-pill) that
// GLIDES between tabs (CSS transform transition) instead of each tab painting
// its own background — so switching tabs animates smoothly. Sliding a finger
// across the bar drags the pill along with it (touch handlers below) and
// releases onto the tab under the finger, like a native iOS tab bar.
//
// Tabs are data-driven: add/remove entries in TABS and the pill math follows.
interface Tab {
  key: string;
  href?: string; // cart tab has no href — it toggles the minicart drawer
  icon: string;
  label: string;
}

const TABS: Tab[] = [
  { key: "home", href: "/", icon: "ion-ios-home", label: "Inicio" },
  {
    key: "shop",
    href: "/shop-left-sidebar",
    icon: "ion-ios-search-strong",
    label: "Tienda",
  },
  { key: "wish", href: "/wishlist", icon: "ion-ios-heart", label: "Favoritos" },
  { key: "cart", icon: "ion-bag", label: "Carrito" },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { count, setCartOpen, cartOpen } = useCart();
  const { count: wishCount } = useWishlist();

  const badges: Record<string, number> = { wish: wishCount, cart: count };

  const routeActive = (t: Tab): boolean => {
    switch (t.key) {
      case "home":
        return pathname === "/";
      case "shop":
        return (
          pathname.startsWith("/shop") || pathname.startsWith("/collections")
        );
      case "wish":
        return pathname.startsWith("/wishlist");
      default:
        return false;
    }
  };

  // While the cart drawer is open IT is the active surface — the pill sits on
  // Carrito and no route tab lights up (never two active tabs at once).
  const cartIndex = TABS.findIndex((t) => t.key === "cart");
  const activeIndex = cartOpen ? cartIndex : TABS.findIndex(routeActive);

  // --- Finger-slide support -------------------------------------------------
  const navRef = useRef<HTMLElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const didDrag = useRef(false);
  const startX = useRef(0);

  const indexFromX = (x: number): number | null => {
    const el = navRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const i = Math.floor(((x - r.left) / r.width) * TABS.length);
    return Math.max(0, Math.min(TABS.length - 1, i));
  };

  const activate = (i: number) => {
    const tab = TABS[i];
    if (tab.key === "cart") {
      setCartOpen(true);
    } else if (tab.href) {
      setCartOpen(false);
      router.push(tab.href);
    }
  };

  // The pill follows the finger mid-slide, otherwise the active tab.
  const pillIndex = dragIndex ?? activeIndex;

  return (
    <nav
      ref={navRef}
      className="pyj-tabbar"
      aria-label="Navegación principal"
      style={{ "--tabs": TABS.length } as React.CSSProperties}
      onTouchStart={(e) => {
        startX.current = e.touches[0].clientX;
        didDrag.current = false;
      }}
      onTouchMove={(e) => {
        const x = e.touches[0].clientX;
        // 10px of intent before it counts as a slide (taps stay taps).
        if (!didDrag.current && Math.abs(x - startX.current) < 10) return;
        didDrag.current = true;
        setDragIndex(indexFromX(x));
      }}
      onTouchEnd={() => {
        if (didDrag.current && dragIndex !== null) activate(dragIndex);
        setDragIndex(null);
        // The browser fires a synthetic click right AFTER touchend — didDrag
        // must stay true long enough to swallow it, then reset so later taps
        // (or clicks with no touchstart) aren't blocked.
        setTimeout(() => {
          didDrag.current = false;
        }, 350);
      }}
      onTouchCancel={() => setDragIndex(null)}
    >
      {/* The single gliding gold-glass pill behind the active tab. */}
      <span
        className={`pyj-tabbar-pill${dragIndex !== null ? " is-dragging" : ""}${
          pillIndex < 0 ? " is-hidden" : ""
        }`}
        style={{ "--i": Math.max(0, pillIndex) } as React.CSSProperties}
        aria-hidden="true"
      >
        <span className="pyj-tabbar-pill_inner" />
      </span>

      {TABS.map((tab, i) => {
        const isActive = cartOpen ? i === cartIndex : routeActive(tab);
        const cls = `pyj-tab${isActive ? " is-active" : ""}`;
        const badge = badges[tab.key] ?? 0;
        const inner = (
          <>
            <span className="pyj-tab-ico">
              <i className={tab.icon} aria-hidden="true" />
              {badge > 0 && <span className="pyj-tab-badge">{badge}</span>}
            </span>
            <span>{tab.label}</span>
          </>
        );
        if (tab.key === "cart") {
          return (
            <button
              key={tab.key}
              type="button"
              className={cls}
              onClick={() => {
                // A slide already activated its target — swallow the tap.
                if (didDrag.current) return;
                setCartOpen(!cartOpen);
              }}
            >
              {inner}
            </button>
          );
        }
        return (
          <Link
            key={tab.key}
            href={tab.href!}
            className={cls}
            onClick={(e) => {
              if (didDrag.current) {
                e.preventDefault();
                return;
              }
              // Tapping a route tab must dismiss the cart — even same-route,
              // where no navigation (and no pathname effect) happens.
              setCartOpen(false);
            }}
          >
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}
