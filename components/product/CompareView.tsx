"use client";

import Link from "next/link";
import { useCompare } from "@/lib/compare-context";
import { formatMoney } from "@/lib/utils";

export default function CompareView() {
  const { items, remove, clear } = useCompare();
  const fmt = (n: number, c: string) =>
    formatMoney({ amount: String(n), currencyCode: c });

  if (items.length === 0) {
    return (
      <div className="compare-area">
        <div className="container">
          <div className="pyj-empty">
            <p>
              Aún no has añadido piezas para comparar. Pulsa el ícono{" "}
              <i className="ion-ios-shuffle-strong" /> en cualquier producto para
              añadirlo aquí (hasta 4).
            </p>
            <Link href="/shop-left-sidebar" className="pyj-btn-gold">
              Ir a la colección
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="compare-area">
      <div className="container">
        {/* Side-by-side comparison cards (no table borders). */}
        <div className="pyj-compare">
          {items.map((it) => (
            <div className="pyj-compare-card" key={it.id}>
              <button
                type="button"
                className="pyj-compare-remove"
                aria-label="Quitar de comparar"
                onClick={() => remove(it.id)}
              >
                <i className="fa fa-times" />
              </button>

              <Link href={`/products/${it.handle}`} className="pyj-compare-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.image} alt={it.title} />
              </Link>

              <h5 className="pyj-compare-name">
                <Link href={`/products/${it.handle}`}>{it.title}</Link>
              </h5>

              <div className="pyj-compare-price">{fmt(it.price, it.currencyCode)}</div>

              <dl className="pyj-compare-specs">
                <div>
                  <dt>Categoría</dt>
                  <dd>{it.category || "—"}</dd>
                </div>
                <div>
                  <dt>Disponibilidad</dt>
                  <dd className={it.available ? "in" : "out"}>
                    {it.available ? "En stock" : "Agotado"}
                  </dd>
                </div>
                <div>
                  <dt>Descripción</dt>
                  <dd className="desc">
                    {it.description
                      ? it.description.slice(0, 150) +
                        (it.description.length > 150 ? "…" : "")
                      : "—"}
                  </dd>
                </div>
              </dl>

              <Link href={`/products/${it.handle}`} className="pyj-btn-gold">
                Ver pieza
              </Link>
            </div>
          ))}
        </div>

        <div className="pyj-compare-actions">
          <button type="button" className="pyj-compare-clear" onClick={clear}>
            Vaciar comparación
          </button>
        </div>
      </div>
    </div>
  );
}
