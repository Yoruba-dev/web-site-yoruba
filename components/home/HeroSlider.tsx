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

// Home hero. Every slide is COMPOSED from three layers rather than one flat
// banner: the scene (bg), the cut-out piece (art) and real HTML copy. Slides
// crossfade — nothing slides sideways. See SITE.heroSlides for the why.
const settings: Settings = {
  infinite: true,
  arrows: true,
  autoplay: true,
  fade: true,
  dots: true,
  // 7 slides — at 7s each a full cycle took 49s and the last ones were never
  // seen. 5.5s keeps every slide within a realistic visit.
  autoplaySpeed: 5500,
  speed: 1600,
  cssEase: "cubic-bezier(0.16, 1, 0.3, 1)",
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
    <section className="pyj-hero" aria-label="Destacados">
      <Slider {...settings} className="main-slider">
        {SITE.heroSlides.map((slide, i) => (
          <div key={slide.title} className="pyj-hero_slide">
            <div className={`pyj-hero_stage pyj-hero_stage--${slide.align}`}>
              {/* layer 1 — the scene */}
              <div
                className="pyj-hero_bg"
                style={{ backgroundImage: `url(${slide.bg})` }}
                aria-hidden="true"
              />
              {/* layer 2 — the cut-out piece, placed exactly where it sits in
                  the composed original (geometry measured from the masters) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="pyj-hero_art"
                style={
                  {
                    "--art-w": slide.artW,
                    "--art-top": slide.artTop,
                  } as React.CSSProperties
                }
                src={slide.art}
                alt={slide.artAlt}
                fetchPriority={i === 0 ? "high" : "low"}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
              />
              {/* layer 3 — real text */}
              <div className="pyj-hero_copy">
                <h2 className="pyj-hero_title">{slide.title}</h2>
                <p className="pyj-hero_text">{slide.text}</p>
                <Link href={slide.href} className="pyj-btn-gold pyj-hero_cta">
                  {slide.cta}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </section>
  );
}
