"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MAIN_MENU, type MenuItem } from "@/lib/menu";
import { SITE } from "@/lib/site";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useCompare } from "@/lib/compare-context";
import { formatMoney } from "@/lib/utils";
import MobileMenu from "./MobileMenu";

function DesktopMenuItem({ item }: { item: MenuItem }) {
  if (item.megaColumns) {
    return (
      <li className="megamenu-holder">
        <Link href={item.href}>{item.label}</Link>
        <ul className="hm-megamenu">
          {item.megaColumns.map((col) => (
            <li key={col.title}>
              <span className="megamenu-title">{col.title}</span>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label + l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
          <li className="menu-item_img" />
        </ul>
      </li>
    );
  }
  if (item.dropdown) {
    return (
      <li className="dropdown-holder">
        <Link href={item.href}>{item.label}</Link>
        <ul className="hm-dropdown">
          {item.dropdown.map((l) => (
            <li key={l.label + l.href}>
              <Link href={l.href}>{l.label}</Link>
            </li>
          ))}
        </ul>
      </li>
    );
  }
  return (
    <li>
      <Link href={item.href}>{item.label}</Link>
    </li>
  );
}

// Header "Two" — single-row header from index-2.html, wired to the cart.
export default function Header() {
  const { lines, count, subtotal, currencyCode, removeItem, cartOpen, setCartOpen } =
    useCart();
  const { count: wishCount } = useWishlist();
  const { count: compareCount } = useCompare();
  const [panel, setPanel] = useState<"menu" | "search" | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPanel(null);
        setCartOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCartOpen]);

  const close = () => {
    setPanel(null);
    setCartOpen(false);
  };
  const openPanel = (p: "menu" | "search") => {
    setCartOpen(false);
    setPanel((cur) => (cur === p ? null : p));
  };
  const toggleCart = () => {
    setPanel(null);
    setCartOpen(!cartOpen);
  };

  return (
    <header className="header-main_area header-main_area-2">
      <div className="header-bottom_area header-bottom_area-2 header-sticky stick">
        <div className="container-fliud">
          <div className="row">
            <div className="col-lg-2 col-md-4 col-sm-4">
              <div className="header-logo">
                <Link href="/">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={SITE.logo.main} alt={`${SITE.name} Logo`} />
                </Link>
              </div>
            </div>
            <div className="col-lg-7 d-none d-lg-block position-static">
              <div className="main-menu_area">
                <nav>
                  <ul>
                    {MAIN_MENU.map((item) => (
                      <DesktopMenuItem key={item.label} item={item} />
                    ))}
                  </ul>
                </nav>
              </div>
            </div>
            <div className="col-lg-3 col-md-8 col-sm-8">
              <div className="header-right_area">
                <ul>
                  <li>
                    <Link href="/wishlist" className="wishlist-btn" title="Favoritos">
                      <i className="ion-android-favorite-outline" />
                      {wishCount > 0 && (
                        <span className="minicart-count">{wishCount}</span>
                      )}
                    </Link>
                  </li>
                  <li>
                    <Link href="/compare" className="wishlist-btn" title="Comparar">
                      <i className="ion-ios-shuffle-strong" />
                      {compareCount > 0 && (
                        <span className="minicart-count">{compareCount}</span>
                      )}
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="search-btn toolbar-btn"
                      onClick={() => openPanel("search")}
                    >
                      <i className="ion-ios-search-strong" />
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="mobile-menu_btn toolbar-btn color--white d-lg-none d-block"
                      onClick={() => openPanel("menu")}
                    >
                      <i className="ion-navicon" />
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="minicart-btn toolbar-btn"
                      onClick={toggleCart}
                    >
                      <i className="ion-bag" />
                      {count > 0 && <span className="minicart-count">{count}</span>}
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Offcanvas: search */}
      <div className={`offcanvas-search_wrapper${panel === "search" ? " open" : ""}`} id="searchBar">
        <div className="offcanvas-menu-inner">
          <div className="container">
            <button type="button" className="btn-close" onClick={close}>
              <i className="ion-android-close" />
            </button>
            <div className="offcanvas-search">
              <form action="/shop" className="hm-searchbox">
                <input type="text" placeholder="Search for item..." />
                <button className="search_btn" type="submit">
                  <i className="ion-ios-search-strong" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Offcanvas: minicart */}
      <div className={`offcanvas-minicart_wrapper${cartOpen ? " open" : ""}`} id="miniCart">
        <div className="offcanvas-menu-inner">
          <button type="button" className="btn-close" onClick={close}>
            <i className="ion-android-close" />
          </button>
          <div className="minicart-content">
            <div className="minicart-heading">
              <h4>Shopping Cart</h4>
            </div>
            {lines.length === 0 ? (
              <ul className="minicart-list">
                <li className="minicart-product">
                  <span className="text-muted">Your cart is empty.</span>
                </li>
              </ul>
            ) : (
              <ul className="minicart-list">
                {lines.map((l) => (
                  <li className="minicart-product" key={l.id}>
                    <button
                      type="button"
                      className="product-item_remove"
                      onClick={() => removeItem(l.id)}
                    >
                      <i className="ion-android-close" />
                    </button>
                    <div className="product-item_img">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={l.image} alt={l.title} />
                    </div>
                    <div className="product-item_content">
                      <Link
                        className="product-item_title"
                        href={`/products/${l.productHandle}`}
                        onClick={close}
                      >
                        {l.title}
                      </Link>
                      <span className="product-item_quantity">
                        {l.quantity} ×{" "}
                        {formatMoney({ amount: String(l.price), currencyCode: l.currencyCode })}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="minicart-item_total">
            <span>Subtotal</span>
            <span className="ammount">
              {formatMoney({ amount: String(subtotal), currencyCode })}
            </span>
          </div>
          <div className="minicart-btn_area">
            <Link href="/cart" onClick={close} className="hiraola-btn hiraola-btn_dark hiraola-btn_fullwidth">
              View Cart
            </Link>
          </div>
          <div className="minicart-btn_area">
            <Link href="/checkout" onClick={close} className="hiraola-btn hiraola-btn_dark hiraola-btn_fullwidth">
              Checkout
            </Link>
          </div>
        </div>
      </div>

      {/* Offcanvas: mobile menu */}
      <div className={`mobile-menu_wrapper${panel === "menu" ? " open" : ""}`} id="mobileMenu">
        <div className="offcanvas-menu-inner">
          <div className="container">
            <button type="button" className="btn-close" onClick={close}>
              <i className="ion-android-close" />
            </button>
            <div className="offcanvas-inner_search">
              <form action="/shop" className="hm-searchbox">
                <input type="text" placeholder="Search for item..." />
                <button className="search_btn" type="submit">
                  <i className="ion-ios-search-strong" />
                </button>
              </form>
            </div>
            <MobileMenu onNavigate={close} />
          </div>
        </div>
      </div>
    </header>
  );
}
