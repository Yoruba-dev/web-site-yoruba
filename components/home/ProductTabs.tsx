"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { ORISHA_NAMES } from "@/lib/orishas";
import ProductSlider from "@/components/product/ProductSlider";

// Tabbed product section. Tabs are derived from the catalogue's own categories
// (the most common product tags), so it adapts to any data set.
export default function ProductTabs({
  products,
  title = "New Products",
}: {
  products: Product[];
  title?: string;
}) {
  const tabs = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) =>
      p.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)),
    );
    return [...counts.entries()]
      .filter(([name]) => !ORISHA_NAMES.includes(name)) // tabs are piece-types
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name]) => name);
  }, [products]);

  const [active, setActive] = useState(tabs[0] ?? "");
  const activeCat = tabs.includes(active) ? active : tabs[0] ?? "";

  const filtered = products.filter((p) => p.tags.includes(activeCat));
  const shown = filtered.length >= 3 ? filtered : products;

  return (
    <div className="hiraola-product-tab_area-2">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="product-tab">
              <div className="hiraola-tab_title">
                <h4>{title}</h4>
              </div>
              <ul className="nav product-menu">
                {tabs.map((name) => (
                  <li key={name}>
                    <a
                      className={activeCat === name ? "active" : undefined}
                      style={{ cursor: "pointer" }}
                      onClick={() => setActive(name)}
                    >
                      <span>{name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="tab-content hiraola-tab_content">
              <div className="tab-pane active show" role="tabpanel">
                <ProductSlider
                  key={activeCat}
                  products={shown}
                  className="hiraola-product-tab_slider-2"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
