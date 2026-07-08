"use client";

import Link from "next/link";
import { useCompare } from "@/lib/compare-context";
import { formatMoney } from "@/lib/utils";

function Stars({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <div className="rating-box">
      <ul>
        {Array.from({ length: 5 }, (_, i) => (
          <li key={i} className={i < filled ? "" : "silver-color"}>
            <i className="fa fa-star-of-david" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CompareView() {
  const { items, remove, clear } = useCompare();
  const fmt = (n: number, c: string) =>
    formatMoney({ amount: String(n), currencyCode: c });

  if (items.length === 0) {
    return (
      <div className="compare-area">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center" style={{ padding: "50px 0" }}>
              <p style={{ marginBottom: 20 }}>
                Aún no has añadido piezas para comparar. Pulsa el ícono{" "}
                <i className="ion-ios-shuffle-strong" /> en cualquier producto para
                añadirlo aquí (hasta 4).
              </p>
              <Link href="/shop-left-sidebar" className="hiraola-btn">
                Ir a la tienda
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="compare-area">
      <div className="container">
        <div className="compare-table table-responsive">
          <table className="table table-bordered table-hover mb-0">
            <tbody>
              <tr>
                <th className="compare-column-titles">Producto</th>
                {items.map((it) => (
                  <td key={it.id} className="compare-column-productinfo">
                    <div className="compare-pdoduct-image">
                      <Link href={`/products/${it.handle}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={it.image} alt={it.title} />
                      </Link>
                      <Link
                        href={`/products/${it.handle}`}
                        className="hiraola-compare_btn"
                      >
                        <span>VER PIEZA</span>
                      </Link>
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <th>Nombre</th>
                {items.map((it) => (
                  <td key={it.id}>
                    <h5 className="compare-product-name">
                      <Link href={`/products/${it.handle}`}>{it.title}</Link>
                    </h5>
                  </td>
                ))}
              </tr>
              <tr>
                <th>Precio</th>
                {items.map((it) => (
                  <td key={it.id} className="compare-price">
                    {fmt(it.price, it.currencyCode)}
                  </td>
                ))}
              </tr>
              <tr>
                <th>Categoría</th>
                {items.map((it) => (
                  <td key={it.id}>{it.category}</td>
                ))}
              </tr>
              <tr>
                <th>Disponibilidad</th>
                {items.map((it) => (
                  <td key={it.id}>{it.available ? "En stock" : "Agotado"}</td>
                ))}
              </tr>
              <tr>
                <th>Valoración</th>
                {items.map((it) => (
                  <td key={it.id}>
                    <Stars rating={it.rating} />
                  </td>
                ))}
              </tr>
              <tr>
                <th>Descripción</th>
                {items.map((it) => (
                  <td key={it.id} className="compare-desc">
                    {it.description
                      ? it.description.slice(0, 150) +
                        (it.description.length > 150 ? "…" : "")
                      : "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <th>Quitar</th>
                {items.map((it) => (
                  <td key={it.id}>
                    <button
                      type="button"
                      className="compare-remove"
                      onClick={() => remove(it.id)}
                      title="Quitar de comparar"
                    >
                      <i className="fa fa-trash" /> Quitar
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="row">
          <div className="col-12" style={{ marginTop: 22 }}>
            <button
              type="button"
              className="hiraola-btn hiraola-btn_dark"
              onClick={clear}
            >
              Vaciar comparación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
