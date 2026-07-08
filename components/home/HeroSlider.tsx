"use client";

import { useEffect } from "react";
import Link from "next/link";
import Slider, { type Settings } from "react-slick";

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

interface Slide {
  bg: string;
  animation: string;
  eyebrow: string;
  eyebrowRest: string;
  title: string;
  subtitle: string;
  price: string;
}

// Home Two hero: full-width slider (slider_area-2) using the original bg-4 / bg-5
// background images (assets/images/slider/4.jpg & 5.jpg).
const SLIDES: Slide[] = [
  {
    bg: "bg-4",
    animation: "animation-style-01",
    eyebrow: "Hecho a mano",
    eyebrowRest: "en Miami",
    title: "Joyería Yoruba",
    subtitle: "Tradición que se lleva puesta",
    price: "$30",
  },
  {
    bg: "bg-5",
    animation: "animation-style-02",
    eyebrow: "Por encargo",
    eyebrowRest: "Oro 10k · 14k · 18k",
    title: "Oro para los Orishas",
    subtitle: "Idde · Opele · Dijes en oro fino",
    price: "$60",
  },
];

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
  // react-slick measures the slide width once and only recomputes on a resize event.
  // After SSR + hydration on a phone (no resize) the fade slide can be mis-sized /
  // positioned off-screen, leaving the hero blank. Nudge a resize after mount so slick
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
    <div className="hiraola-slider_area-2">
      <Slider {...settings} className="main-slider">
        {SLIDES.map((slide) => (
          <div key={slide.bg} className={`single-slide ${slide.animation} ${slide.bg}`}>
            <div className="container">
              <div className="slider-content">
                <h5>
                  <span>{slide.eyebrow}</span> {slide.eyebrowRest}
                </h5>
                <h2>{slide.title}</h2>
                <h3>{slide.subtitle}</h3>
                <h4>
                  Desde <span>{slide.price}</span>
                </h4>
                <div className="hiraola-btn-ps_center slide-btn">
                  <Link className="hiraola-btn" href="/shop-left-sidebar">
                    Ver Colección
                  </Link>
                </div>
              </div>
              <div className="slider-progress" />
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
}
