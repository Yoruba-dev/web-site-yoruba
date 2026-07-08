"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/menu";

const ALWAYS_VISIBLE = 9;

export default function CategoryMenu() {
  const [open, setOpen] = useState(true); // expanded on desktop
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? CATEGORIES : CATEGORIES.slice(0, ALWAYS_VISIBLE);
  const hasMore = CATEGORIES.length > ALWAYS_VISIBLE;

  return (
    <div className="category-menu">
      <div className="category-heading">
        <h2 className="categories-toggle" onClick={() => setOpen((v) => !v)}>
          <span>Shop by categories</span>
        </h2>
      </div>
      <div
        id="cate-toggle"
        className="category-menu-list"
        style={{ display: open ? "block" : "none" }}
      >
        <ul>
          {visible.map((cat) => (
            <li key={cat}>
              <Link href="/shop">{cat}</Link>
            </li>
          ))}
          {hasMore && (
            <li className="rx-parent" onClick={() => setShowAll((v) => !v)}>
              <a className="rx-default" style={{ cursor: "pointer" }}>
                {showAll ? "Collapse" : "More Categories"}
              </a>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
