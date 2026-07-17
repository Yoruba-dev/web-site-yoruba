"use client";

import { useEffect } from "react";
import Link from "next/link";
import Slider, { type Settings } from "react-slick";
import { SITE } from "@/lib/site";
import { sizedImageUrl } from "@/lib/utils";

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

// Home hero: crossfading carousel of the store's designed Shopify banners
// (SITE.heroSlides). The banners are pre-composed (copy baked into the image), so
// each slide is just the image — no HTML overlay (that would double the text).
// Height is capped on desktop so the banner stays compact; mobile shows it whole.
const settings: Settings = {
  infinite: true,
  arrows: true,
  autoplay: true,
  fade: true,
  dots: true,
  autoplaySpeed: 5000,
  speed: 1000,
  adaptiveHeight: false,
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
        {SITE.heroSlides.map((slide, i) => (
          <div key={slide.image} className="hero-slide">
            <Link href={slide.href} className="single-slide" aria-label={slide.alt}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="hero-slide_img"
                // Size through the Shopify CDN (webp + width) like every other
                // image — the raw PNG is ~2 MB. The first slide is the LCP, so
                // load it eagerly with high priority; later slides lazy-load.
                src={sizedImageUrl(slide.image, slide.width)}
                alt={slide.alt}
                width={slide.width}
                height={slide.height}
                fetchPriority={i === 0 ? "high" : "low"}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
              />
            </Link>
          </div>
        ))}
      </Slider>
    </div>
  );
}
