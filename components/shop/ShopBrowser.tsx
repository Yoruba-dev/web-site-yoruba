"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import SafeImage from "@/components/ui/SafeImage";
import PurchaseButton from "@/components/product/PurchaseButton";
import CompareButton from "@/components/product/CompareButton";
import WishlistButton from "@/components/product/WishlistButton";
import { formatMoney } from "@/lib/utils";
import { isPlaceholderPriced, CONSULT_PRICE_LABEL } from "@/lib/commerce";
import { ORISHA_NAMES } from "@/lib/orishas";
import type { Product } from "@/lib/types";

type ShopView = "grid" | "list";

const SORTS = [
  { value: "relevance", label: "Organizado por tipo" },
  { value: "name-asc", label: "Nombre, A a Z" },
  { value: "name-desc", label: "Nombre, Z a A" },
  { value: "price-asc", label: "Precio, menor a mayor" },
  { value: "price-desc", label: "Precio, mayor a menor" },
];

function priceNum(p: Product) {
  return Number(p.price.amount);
}

/** The piece's type category (first non-Orisha tag) — used to group the default
 *  catalogue view so all rings / tools / pendants sit together, not scattered. */
function primaryType(p: Product): string {
  return p.tags.find((t) => !ORISHA_NAMES.includes(t)) ?? "￿";
}

function ListProductItem({ product }: { product: Product }) {
  const href = `/products/${product.handle}`;
  const [primary, secondary] = product.images;
  return (
    <div className="col-lg-4">
      <div className="list-slide_item">
        <div className="single_product">
          <div className="product-img">
            <Link href={href}>
              <SafeImage
                className="primary-img"
                src={primary?.url}
                width={600}
                alt={product.title}
              />
              <SafeImage
                className="secondary-img"
                src={secondary?.url ?? primary?.url}
                width={600}
                alt={product.title}
              />
            </Link>
            {product.badge && <span className="sticker">{product.badge}</span>}
          </div>
          <div className="hiraola-product_content">
            <div className="product-desc_info">
              <h6>
                <Link className="product-name" href={href}>
                  {product.title}
                </Link>
              </h6>
              <div className="price-box">
                {isPlaceholderPriced(product.price) ? (
                  <span className="new-price pyj-price-consult">
                    {CONSULT_PRICE_LABEL}
                  </span>
                ) : (
                  <>
                    <span className="new-price">{formatMoney(product.price)}</span>
                    {product.compareAtPrice && (
                      <span className="old-price">
                        {formatMoney(product.compareAtPrice)}
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="product-short_desc">
                <p>{product.description}</p>
              </div>
            </div>
            <div className="add-actions">
              <ul>
                <li>
                  <PurchaseButton className="hiraola-add_cart" product={product}>
                    Añadir al carrito
                  </PurchaseButton>
                </li>
                <li>
                  <CompareButton className="hiraola-add_compare" product={product} />
                </li>
                <li>
                  <WishlistButton className="hiraola-add_compare" product={product} />
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopBrowser({
  products,
  sidebar,
  view = "grid",
  columns = 3,
}: {
  products: Product[];
  sidebar?: "left" | "right";
  view?: ShopView;
  columns?: 3 | 4;
}) {
  const maxPrice = Math.max(1, Math.ceil(Math.max(...products.map(priceNum))));
  const currency = products[0]?.price.currencyCode ?? "USD";
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [priceMax, setPriceMax] = useState(maxPrice);
  const [sort, setSort] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState("");

  // Deep-linking: ?cat=Oshún pre-selects a category filter, ?q=idde pre-fills a
  // text search (from the global SearchBar's "Ver todos los resultados").
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("cat");
    if (cat) setSelectedCats([cat]);
    const q = params.get("q");
    if (q) setQuery(q);
  }, []);

  // Categories are derived from the products' own tags. Split into piece-types and
  // Orishas so the sidebar shows two clean filter groups.
  const { typeCats, orishaCats } = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) =>
      p.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)),
    );
    const all = [...counts.entries()].map(([name, count]) => ({ name, count }));
    return {
      typeCats: all
        .filter((c) => !ORISHA_NAMES.includes(c.name))
        .sort((a, b) => b.count - a.count),
      orishaCats: all
        .filter((c) => ORISHA_NAMES.includes(c.name))
        .sort((a, b) => ORISHA_NAMES.indexOf(a.name) - ORISHA_NAMES.indexOf(b.name)),
    };
  }, [products]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => priceNum(p) <= priceMax);
    if (selectedCats.length) {
      list = list.filter((p) => p.tags.some((t) => selectedCats.includes(t)));
    }
    if (query.trim().length > 1) {
      // Accent-insensitive text search over title + tags (matches /api/search).
      const norm = (s: string) =>
        s
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      const nq = norm(query.trim());
      list = list.filter(
        (p) =>
          norm(p.title).includes(nq) || p.tags.some((t) => norm(t).includes(nq)),
      );
    }
    const sorted = [...list];
    switch (sort) {
      case "relevance":
        // Group by piece type (stable) so same-type pieces cluster together
        // and, within a type, the best-selling order from Shopify is kept.
        sorted.sort((a, b) => primaryType(a).localeCompare(primaryType(b)));
        break;
      case "name-asc":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "name-desc":
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "price-asc":
        sorted.sort((a, b) => priceNum(a) - priceNum(b));
        break;
      case "price-desc":
        sorted.sort((a, b) => priceNum(b) - priceNum(a));
        break;
    }
    return sorted;
  }, [products, selectedCats, priceMax, sort, query]);

  function toggleCat(name: string) {
    setSelectedCats((s) =>
      s.includes(name) ? s.filter((x) => x !== name) : [...s, name],
    );
  }

  // Compact toggle chip — replaces long checkbox lists so the filter panel is
  // short and scannable (a single wrapping row per group) instead of a tall,
  // scroll-heavy column.
  const catChip = (c: { name: string; count: number }) => {
    const on = selectedCats.includes(c.name);
    return (
      <button
        key={c.name}
        type="button"
        className={`pyj-chip${on ? " is-on" : ""}`}
        onClick={() => toggleCat(c.name)}
        aria-pressed={on}
      >
        {c.name}
        <span className="pyj-chip-count">{c.count}</span>
      </button>
    );
  };

  const productAreaClass = sidebar
    ? `col-lg-9 ${sidebar === "left" ? "order-1 order-lg-2" : "order-1 order-lg-1"}`
    : "col-lg-12";
  const gridModifier = sidebar ? "gridview-3" : `gridview-${columns}`;
  // 2 per row on phones (col-6) → tighter, premium catalogue; 3-4 on desktop.
  const colClass =
    !sidebar && columns === 4 ? "col-6 col-lg-3" : "col-6 col-lg-4";
  const wrapClass =
    view === "list"
      ? "shop-product-wrap grid listview row"
      : `shop-product-wrap grid ${gridModifier} row`;

  // The filter controls (price + type + Orisha). Reused in the desktop sidebar
  // AND the mobile "Filtrar" panel, so on phones the filters sit at the TOP
  // (behind a toggle) instead of buried at the bottom of the page.
  const filterControls = (
    <div className="hiraola-sidebar-catagories_area">
      {/* Price filter */}
      <div className="hiraola-sidebar_categories">
        <div className="hiraola-categories_title">
          <h5>Precio</h5>
        </div>
        <div className="price-filter">
          <input
            type="range"
            min={0}
            max={maxPrice}
            value={priceMax}
            onChange={(e) => setPriceMax(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <div className="price-slider-amount">
            <div className="label-input">
              <label>Hasta: </label>
              <strong>
                {formatMoney({ amount: String(priceMax), currencyCode: currency })}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Piece-type filter */}
      <div className="hiraola-sidebar_categories">
        <div className="hiraola-categories_title">
          <h5>Tipo de pieza</h5>
        </div>
        <div className="pyj-chips">{typeCats.map(catChip)}</div>
      </div>

      {/* Orisha filter */}
      {orishaCats.length > 0 && (
        <div className="hiraola-sidebar_categories">
          <div className="hiraola-categories_title">
            <h5>Por Orisha</h5>
          </div>
          <div className="pyj-chips">{orishaCats.map(catChip)}</div>
        </div>
      )}

      {selectedCats.length > 0 && (
        <button
          type="button"
          className="pyj-clear-filters"
          onClick={() => setSelectedCats([])}
        >
          Limpiar filtros ({selectedCats.length})
        </button>
      )}
    </div>
  );

  // Desktop sidebar column (hidden on phones — phones use the toggle above the grid).
  const sidebarColumn = (
    <div
      className={`col-lg-3 d-none d-lg-block ${
        sidebar === "left" ? "order-lg-1" : "order-lg-2"
      }`}
    >
      {filterControls}
      <div className="sidebar-banner_area">
        <div className="banner-item img-hover_effect">
          <Link href="#">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/images/banner/1_1.jpg" alt="Shop Banner" />
          </Link>
        </div>
      </div>
    </div>
  );

  // Mobile-only "Filtrar" toggle + collapsible panel (shown at the top of the grid).
  const mobileFilters = sidebar ? (
    <div className="d-lg-none" style={{ marginBottom: 18 }}>
      <button
        type="button"
        onClick={() => setShowFilters((v) => !v)}
        className="hiraola-btn hiraola-btn_fullwidth"
        style={{ width: "100%" }}
      >
        <i className="fa fa-filter" style={{ marginRight: 8 }} />
        {showFilters ? "Ocultar filtros" : "Filtrar"}
        {selectedCats.length > 0 ? ` (${selectedCats.length})` : ""}
      </button>
      {showFilters && <div style={{ marginTop: 16 }}>{filterControls}</div>}
    </div>
  ) : null;

  return (
    <div className="hiraola-content_wrapper">
      <div className="container">
        <div className="row">
          {sidebar === "left" && sidebarColumn}
          <div className={productAreaClass}>
            {mobileFilters}
            <div className="shop-toolbar">
              <div className="product-view-mode">
                <Link
                  className={view === "grid" ? "active grid-3" : "grid-3"}
                  href="/shop-3-column"
                  title="Grid View"
                >
                  <i className="fa fa-th" />
                </Link>
                <Link
                  className={view === "list" ? "active list" : "list"}
                  href="/shop-list-fullwidth"
                  title="List View"
                >
                  <i className="fa fa-th-list" />
                </Link>
              </div>
              <div className="product-item-selection_area">
                <div className="product-short">
                  <label className="select-label">Ordenar por:</label>
                  <select
                    className="nice-select"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    {SORTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {query.trim().length > 1 && (
              <p className="pyj-search-active">
                Buscando: <strong>“{query.trim()}”</strong> · {filtered.length}{" "}
                {filtered.length === 1 ? "resultado" : "resultados"}
                <button
                  type="button"
                  className="pyj-search-clear"
                  onClick={() => setQuery("")}
                  aria-label="Quitar búsqueda"
                >
                  ✕
                </button>
              </p>
            )}

            {filtered.length === 0 ? (
              <p style={{ padding: "30px 0", color: "#a99d83" }}>
                Ningún producto coincide con los filtros.{" "}
                <a
                  onClick={() => {
                    setSelectedCats([]);
                    setPriceMax(maxPrice);
                    setQuery("");
                  }}
                  style={{ cursor: "pointer", color: "var(--pyj-gold)" }}
                >
                  Restablecer
                </a>
              </p>
            ) : (
              <div className={wrapClass}>
                {view === "list"
                  ? filtered.map((product) => (
                      <ListProductItem key={product.id} product={product} />
                    ))
                  : filtered.map((product) => (
                      <div className={colClass} key={product.id}>
                        <div className="slide-item">
                          <ProductCard product={product} />
                        </div>
                      </div>
                    ))}
              </div>
            )}
          </div>
          {sidebar === "right" && sidebarColumn}
        </div>
      </div>
    </div>
  );
}
