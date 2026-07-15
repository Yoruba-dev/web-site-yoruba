"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductImage } from "@/lib/types";
import SafeImage from "@/components/ui/SafeImage";

// "Tab Style" gallery with hover-zoom (replaces the template's jQuery
// elevateZoom): clicking a thumbnail switches the main image; hovering the main
// image magnifies it, following the cursor.
//
// `featuredUrl` lets a parent (the variant selector) drive the main image: when
// a size is picked, the gallery jumps to that variant's photo — even if it is
// not among the thumbnails. Clicking any thumbnail takes control back.
export default function ProductGallery({
  images,
  title,
  featuredUrl,
}: {
  images: ProductImage[];
  title: string;
  featuredUrl?: string;
}) {
  const list =
    images.length > 0
      ? images
      : [{ url: "/assets/images/single-product/large-size/1.jpg", altText: title }];
  const [active, setActive] = useState(0);
  const [override, setOverride] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("center center");
  // Skip the very first run so the page loads on the product's hero image; only
  // an ACTIVE variant change (a later featuredUrl) switches the gallery.
  const firstRun = useRef(true);

  // Thumbnail strip is a horizontal carousel: fixed-size thumbnails that scroll
  // sideways (with arrows) instead of wrapping into a tall grid when a piece has
  // many photos. Arrows only show when the strip actually overflows.
  const stripRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollWidth > el.clientWidth + 4);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [list.length]);
  const scrollStrip = (dir: number) =>
    stripRef.current?.scrollBy({ left: dir * 220, behavior: "smooth" });

  // When the selected variant changes, feature its image. If that image is also
  // a thumbnail, highlight it; otherwise just show it as the main image.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (!featuredUrl) return;
    const idx = list.findIndex((img) => img.url === featuredUrl);
    if (idx >= 0) {
      setActive(idx);
      setOverride(null);
    } else {
      setOverride(featuredUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredUrl]);

  const currentUrl = override ?? list[Math.min(active, list.length - 1)].url;
  const currentAlt = list.find((i) => i.url === currentUrl)?.altText || title;

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
        <SafeImage
          className="zoompro"
          src={currentUrl}
          width={1400}
          loading="eager"
          alt={currentAlt}
          style={{
            transform: zoom ? "scale(2)" : "scale(1)",
            transformOrigin: origin,
            transition: zoom ? "transform 0.05s ease-out" : "transform 0.3s ease",
            display: "block",
            width: "100%",
          }}
        />
      </div>
      <div className={`pyj-thumb-strip${overflowing ? " has-nav" : ""}`}>
        {overflowing && (
          <button
            type="button"
            className="pyj-thumb-nav prev"
            aria-label="Ver fotos anteriores"
            onClick={() => scrollStrip(-1)}
          >
            <i className="fa fa-angle-left" />
          </button>
        )}
        <div id="gallery" className="sp-img_slider" ref={stripRef}>
          {list.map((img, i) => (
            <a
              key={img.url + i}
              className={!override && i === active ? "active" : undefined}
              onClick={() => {
                setActive(i);
                setOverride(null);
              }}
              style={{ cursor: "pointer" }}
            >
              <SafeImage src={img.url} width={200} alt={title} />
            </a>
          ))}
        </div>
        {overflowing && (
          <button
            type="button"
            className="pyj-thumb-nav next"
            aria-label="Ver más fotos"
            onClick={() => scrollStrip(1)}
          >
            <i className="fa fa-angle-right" />
          </button>
        )}
      </div>
    </div>
  );
}
