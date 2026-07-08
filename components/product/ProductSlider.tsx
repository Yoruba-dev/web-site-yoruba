"use client";

import { useEffect } from "react";
import Slider, { type Settings } from "react-slick";
import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

type ArrowProps = {
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
};

function PrevArrow({ className, style, onClick }: ArrowProps) {
  return (
    <button className={className} style={style} onClick={onClick} type="button">
      <i className="ion-ios-arrow-back" />
    </button>
  );
}

function NextArrow({ className, style, onClick }: ArrowProps) {
  return (
    <button className={className} style={style} onClick={onClick} type="button">
      <i className="ion-ios-arrow-forward" />
    </button>
  );
}

const base = {
  infinite: true,
  arrows: true,
  dots: false,
  speed: 1000,
  slidesToScroll: 1,
  prevArrow: <PrevArrow />,
  nextArrow: <NextArrow />,
};

// `.hiraola-product_slider` — 5 across (New Arrival row).
const FIVE_UP: Settings = {
  ...base,
  slidesToShow: 5,
  responsive: [
    { breakpoint: 1501, settings: { slidesToShow: 5 } },
    { breakpoint: 1200, settings: { slidesToShow: 4 } },
    { breakpoint: 992, settings: { slidesToShow: 3 } },
    { breakpoint: 768, settings: { slidesToShow: 2 } },
    { breakpoint: 575, settings: { slidesToShow: 1 } },
  ],
};

// `.hiraola-product-tab_slider-2` — 3 across (tabbed product section).
const THREE_UP: Settings = {
  ...base,
  slidesToShow: 3,
  responsive: [
    { breakpoint: 1501, settings: { slidesToShow: 3 } },
    { breakpoint: 1200, settings: { slidesToShow: 3 } },
    { breakpoint: 992, settings: { slidesToShow: 2 } },
    { breakpoint: 768, settings: { slidesToShow: 2 } },
    { breakpoint: 575, settings: { slidesToShow: 1 } },
  ],
};

const PRESETS = {
  "hiraola-product_slider": FIVE_UP,
  "hiraola-product-tab_slider-2": THREE_UP,
} as const;

export default function ProductSlider({
  products,
  className = "hiraola-product_slider",
}: {
  products: Product[];
  className?: keyof typeof PRESETS;
}) {
  // react-slick picks slidesToShow from window.innerWidth but only re-reads it on a
  // resize event. After SSR + hydration on a phone (where no resize ever fires) it can
  // stay stuck on the desktop default and render too many cards, cut off at the edges.
  // Nudge a resize after mount so it applies the correct responsive setting and
  // recomputes the slide widths.
  useEffect(() => {
    const fire = () => window.dispatchEvent(new Event("resize"));
    const raf = requestAnimationFrame(fire);
    const t = window.setTimeout(fire, 250);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, []);

  return (
    <Slider {...PRESETS[className]} className={className}>
      {products.map((product) => (
        <div className="slide-item" key={product.id}>
          <ProductCard product={product} />
        </div>
      ))}
    </Slider>
  );
}
