"use client";

import { useEffect } from "react";
import Link from "next/link";
import Slider, { type Settings } from "react-slick";
import { SITE } from "@/lib/site";

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

// Home hero: full-bleed image carousel driven by the store's real Shopify
// homepage banners (SITE.heroSlides). The banners are pre-designed (text baked
// in), so each slide is just the image — no overlay copy or scrim.
const settings: Settings = {
  infinite: true,
  arrows: true,
  autoplay: true,
  fade: true,
  dots: true,
  autoplaySpeed: 5000,
  speed: 1000,
  adaptiveHeight: true,
  pauseOnHover: false,
  pauseOnFocus: false,
  slidesToShow: 1,
  slidesToScroll: 1,
  prevArrow: <PrevArrow />,
  nextArrow: <NextArrow />,
};

export default function HeroSlider() {
  // react-slick measures the slide width once and only recomputes on a resize
  // event. After SSR + hydration on a phone (no resize) the fade slide can be
  // mis-sized, leaving the hero blank. Nudge a resize after mount so slick
  // recomputes and the active slide paints.
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
    <div className="hiraola-slider_area-2 hero-banner_slider">
      <Slider {...settings} className="main-slider">
        {SITE.heroSlides.map((slide) => (
          <div key={slide.image} className="hero-banner_slide">
            <Link href={slide.href} aria-label={slide.alt}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.image}
                alt={slide.alt}
                width={slide.width}
                height={slide.height}
              />
            </Link>
          </div>
        ))}
      </Slider>
    </div>
  );
}
