"use client";

import Link from "next/link";
import Slider, { type Settings } from "react-slick";
import SafeImage from "@/components/ui/SafeImage";
import type { CategoryCollection } from "@/lib/products";

// A circular-thumbnail carousel of Shopify collections — the home "Categorías de
// Productos" section. Each circle links to its /collections/[handle] page.
const settings: Settings = {
  infinite: true,
  arrows: false,
  dots: true,
  autoplay: true,
  autoplaySpeed: 4500,
  speed: 700,
  slidesToShow: 4,
  slidesToScroll: 1,
  responsive: [
    { breakpoint: 992, settings: { slidesToShow: 3 } },
    { breakpoint: 576, settings: { slidesToShow: 2 } },
  ],
};

// Shopify CDN transform → a right-sized, browser-safe image (also dodges raw HEIC).
function sized(url: string | null): string | undefined {
  if (!url) return undefined;
  return `${url}${url.includes("?") ? "&" : "?"}width=400`;
}

export default function CategoryCircles({
  collections,
}: {
  collections: CategoryCollection[];
}) {
  if (!collections || collections.length === 0) return null;

  return (
    <section className="pyj-catcircles">
      <div className="container">
        <div className="pyj-catcircles_head">
          <span className="pyj-eyebrow">✦ Explora ✦</span>
          <h2>Categorías de Productos</h2>
        </div>
        <Slider {...settings} className="pyj-catcircles_slider">
          {collections.map((c) => (
            <div key={c.handle} className="pyj-catcircle">
              <Link href={`/collections/${c.handle}`} className="pyj-catcircle_link">
                <span className="pyj-catcircle_img">
                  <SafeImage src={sized(c.image)} alt={c.title} />
                </span>
                <span className="pyj-catcircle_label">{c.title}</span>
              </Link>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
}
