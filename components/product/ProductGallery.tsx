"use client";

import { useState } from "react";
import type { ProductImage } from "@/lib/types";

// "Tab Style" gallery with hover-zoom (replaces the template's jQuery
// elevateZoom): clicking a thumbnail switches the main image; hovering the main
// image magnifies it, following the cursor.
export default function ProductGallery({
  images,
  title,
}: {
  images: ProductImage[];
  title: string;
}) {
  const list =
    images.length > 0
      ? images
      : [{ url: "/assets/images/single-product/large-size/1.jpg", altText: title }];
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("center center");
  const current = list[Math.min(active, list.length - 1)];

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setOrigin(`${x}% ${y}%`);
  }

  return (
    <div className="sp-img_area">
      <div
        className="zoompro-border"
        style={{ overflow: "hidden", cursor: "zoom-in" }}
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={onMove}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="zoompro"
          src={current.url}
          alt={current.altText || title}
          style={{
            transform: zoom ? "scale(2)" : "scale(1)",
            transformOrigin: origin,
            transition: zoom ? "transform 0.05s ease-out" : "transform 0.3s ease",
            display: "block",
            width: "100%",
          }}
        />
      </div>
      <div id="gallery" className="sp-img_slider">
        {list.map((img, i) => (
          <a
            key={img.url + i}
            className={i === active ? "active" : undefined}
            onClick={() => setActive(i)}
            style={{ cursor: "pointer" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={title} />
          </a>
        ))}
      </div>
    </div>
  );
}
