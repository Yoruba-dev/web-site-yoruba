"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import Pagination from "@/components/ui/Pagination";
import { formatMoney } from "@/lib/utils";
import {
  buildDepartamentos,
  buildFacetas,
  coincideFaceta,
} from "@/lib/taxonomy";
import type { Product } from "@/lib/types";

// Products per page. A multiple of both 3 and 4 (this shop's grid column
// counts) so every page ends on a full row in either layout.
const PAGE_SIZE = 24;

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

/** El tipo de pieza, para agrupar la vista por defecto.
 *
 *  Antes esto era "la primera etiqueta que no sea un Orisha", y por eso la
 *  tienda abría agrupada por `acero-inoxidable` o `por-orden`: son etiquetas de
 *  gestión del taller, no tipos. Ahora sale de `productType`, que Shopify trae
 *  puesto en todo el catálogo. Las piezas sin tipo se van al final. */
function tipoDe(p: Product): string {
  return p.productType?.trim() || "￿";
}

export default function ShopBrowser({
  products,
  sidebar,
  columns = 3,
}: {
  products: Product[];
  sidebar?: "left" | "right";
  columns?: 3 | 4;
}) {
  const maxPrice = Math.max(1, Math.ceil(Math.max(...products.map(priceNum))));
  const currency = products[0]?.price.currencyCode ?? "USD";
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [priceMax, setPriceMax] = useState(maxPrice);
  const [sort, setSort] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const resultsTopRef = useRef<HTMLDivElement>(null);

  const [seenFilterKey, setSeenFilterKey] = useState<string | null>(null);

  // Deep-linking: ?cat=Oshún pre-selects a category filter, ?q=idde pre-fills a
  // text search (from the global SearchBar's "Ver todos los resultados").
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("cat");
    if (cat) setSelectedCats([cat]);
    const q = params.get("q");
    if (q) setQuery(q);
  }, []);

  // Los tipos de pieza salen de `productType` (una decena de valores limpios),
  // y el resto de etiquetas se reparten por facetas. Antes todo esto era una
  // sola lista de ~50 fichas mezclando tipo, material, público, precio y
  // banderas internas bajo el rótulo "Tipo de pieza".
  const tipos = useMemo(
    () =>
      buildDepartamentos(products).map((d) => ({
        name: d.tipo,
        count: d.products.length,
      })),
    [products],
  );
  const facetas = useMemo(() => buildFacetas(products), [products]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => priceNum(p) <= priceMax);
    if (selectedCats.length) {
      // O dentro de un grupo, Y entre grupos.
      //
      // Marcar "Anillos" y "Pulsos" enseña los dos tipos (O). Pero marcar
      // "Anillos" y "Oro 10k" enseña los anillos QUE ADEMÁS son de oro 10k (Y).
      // Antes todo se combinaba con O, así que añadir un segundo filtro AMPLIABA
      // el resultado en vez de acotarlo — lo contrario de lo que espera quien
      // está buscando algo. Pasó al reorganizar la tienda de 2 grupos a 5.
      //
      // El grupo de cada selección se deduce de los mismos datos que pintan las
      // fichas, así que no hay ninguna lista que mantener aparte.
      const porGrupo = new Map<string, string[]>();
      for (const sel of selectedCats) {
        const grupo = tipos.some((t) => t.name === sel)
          ? "tipo"
          : (facetas.find((g) => g.valores.some((v) => v.label === sel))?.faceta ??
            "otro");
        const previo = porGrupo.get(grupo);
        if (previo) previo.push(sel);
        else porGrupo.set(grupo, [sel]);
      }
      list = list.filter((p) =>
        [...porGrupo.entries()].every(([grupo, sels]) =>
          grupo === "tipo"
            ? sels.includes(tipoDe(p))
            : sels.some((c) => coincideFaceta(p, c)),
        ),
      );
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
        // Agrupa por tipo de pieza (orden estable), y dentro de cada tipo se
        // conserva el orden de más vendido que ya trae Shopify.
        sorted.sort((a, b) => tipoDe(a).localeCompare(tipoDe(b)));
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
  }, [products, selectedCats, priceMax, sort, query, tipos, facetas]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Keep `page` valid DURING RENDER — not in a post-paint effect, which would
  // flash the wrong slice (or a blank grid) for one frame before correcting.
  // React discards this render and re-renders with the fixed page before it
  // ever paints. The two adjustments are mutually exclusive (`else if`) so a
  // filter change that also shrinks the range still lands on page 1, not on the
  // clamped last page.
  const filterKey = JSON.stringify([selectedCats, priceMax, sort, query]);
  if (seenFilterKey === null) {
    setSeenFilterKey(filterKey); // record the baseline on first render
  } else if (filterKey !== seenFilterKey) {
    setSeenFilterKey(filterKey);
    setPage(1); // any real filter/sort/search change → back to page 1
  } else if (page > pageCount) {
    setPage(pageCount); // catalogue shrank under us → clamp into range
  }

  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  function goToPage(next: number) {
    setPage(next);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    resultsTopRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }

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
  const wrapClass = `shop-product-wrap grid ${gridModifier} row`;

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

      {/* Tipo de pieza — de `productType`, el eje real del catálogo */}
      <div className="hiraola-sidebar_categories">
        <div className="hiraola-categories_title">
          <h5>Tipo de pieza</h5>
        </div>
        <div className="pyj-chips">{tipos.map(catChip)}</div>
      </div>

      {/* Las demás facetas (Orisha, material, para quién, disponibilidad).
          Cada una se pinta sola si el catálogo la tiene poblada, y desaparece
          si solo tuviera un valor: un filtro que no divide nada estorba. */}
      {facetas.map((g) => (
        <div className="hiraola-sidebar_categories" key={g.faceta}>
          <div className="hiraola-categories_title">
            <h5>{g.titulo}</h5>
          </div>
          <div className="pyj-chips">
            {g.valores.map((v) => catChip({ name: v.label, count: v.count }))}
          </div>
        </div>
      ))}

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
            <div className="shop-toolbar" ref={resultsTopRef}>
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
              <>
                <div className={wrapClass}>
                  {pageItems.map((product) => (
                    <div className={colClass} key={product.id}>
                      <div className="slide-item">
                        <ProductCard product={product} />
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination page={page} pageCount={pageCount} onChange={goToPage} />
              </>
            )}
          </div>
          {sidebar === "right" && sidebarColumn}
        </div>
      </div>
    </div>
  );
}
