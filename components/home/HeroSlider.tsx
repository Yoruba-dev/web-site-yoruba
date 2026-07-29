"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Slider, { type Settings } from "react-slick";
import { SITE } from "@/lib/site";

const BANNER_DIR = "/assets/images/hero/banner";
// The three encoded widths. `sizes="100vw"` lets the browser pick one; a phone
// never reaches these sources at all (they are behind a min-width media query).
const BANNER_WIDTHS = [828, 1100, 1376] as const;

function bannerSrcSet(name: string, ext: "avif" | "webp") {
  return BANNER_WIDTHS.map((w) => `${BANNER_DIR}/${name}-${w}.${ext} ${w}w`).join(", ");
}

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

// Home hero. Each slide has TWO renditions picked by media query — the owner's
// composed banner on desktop, a scene+cut-out+HTML-copy build on phones. See
// SITE.heroSlides for why. Slides crossfade; they never slide sideways.
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
  // Only the first slide's imagery is in the initial HTML. `fade` stacks all 7
  // slides in the same place, so every one of them counts as "in the viewport"
  // and `loading="lazy"` would NOT hold them back — all 7 would race the LCP
  // image on first paint. Mounting the rest once the page is idle keeps the
  // critical path down to a single banner.
  const [restReady, setRestReady] = useState(false);

  useEffect(() => {
    const idle =
      window.requestIdleCallback ??
      ((cb: IdleRequestCallback) => window.setTimeout(() => cb({} as IdleDeadline), 200));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = idle(() => setRestReady(true), { timeout: 2500 });
    return () => cancel(handle as number);
  }, []);

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
        {SITE.heroSlides.map((slide, i) => {
          const show = i === 0 || restReady;
          return (
            <div key={slide.banner} className="pyj-hero_slide">
              <div className={`pyj-hero_stage pyj-hero_stage--${slide.align}`}>
                {/* the scene — phones only; on desktop the banner already
                    contains it, and `display:none` there stops the fetch */}
                {show && (
                  <div
                    className="pyj-hero_bg"
                    style={{ backgroundImage: `url(${slide.bg})` }}
                    aria-hidden="true"
                  />
                )}

                {show && (
                  <picture className="pyj-hero_pic">
                    <source
                      media="(min-width: 768px)"
                      type="image/avif"
                      srcSet={bannerSrcSet(slide.banner, "avif")}
                      sizes="100vw"
                    />
                    <source
                      media="(min-width: 768px)"
                      type="image/webp"
                      srcSet={bannerSrcSet(slide.banner, "webp")}
                      sizes="100vw"
                    />
                    {/* phones get just the piece; the copy below is real text */}
                    <source media="(max-width: 767px)" srcSet={slide.art} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="pyj-hero_art"
                      src={`${BANNER_DIR}/${slide.banner}-1376.webp`}
                      alt={slide.artAlt}
                      width={1376}
                      height={768}
                      fetchPriority={i === 0 ? "high" : "low"}
                      /* NOT `lazy` for the rest: `fade` stacks all 7 slides on
                         the same pixels, so every one is already inside the
                         viewport and the browser never re-evaluates them — they
                         simply never loaded, and the carousel advanced to blank
                         slides. Deferral is the mount-on-idle above; here the
                         only lever that matters is the low priority. */
                      loading="eager"
                      decoding="async"
                    />
                  </picture>
                )}

                {/* Visible on phones; on desktop this is the accessible and
                    indexable equivalent of the text baked into the banner, so it
                    is visually hidden rather than removed. */}
                <div className="pyj-hero_copy">
                  <h2 className="pyj-hero_title">{slide.title}</h2>
                  <p className="pyj-hero_text">{slide.text}</p>
                </div>

                {/* the frame mirrors the banner's own box (see globals.css), so
                    the button stays glued to the artwork instead of to the stage */}
                <div className="pyj-hero_frame">
                  <Link
                    href={slide.href}
                    className="pyj-btn-gold pyj-hero_cta"
                    style={
                      {
                        "--cta-top": slide.ctaTop,
                        "--cta-x": slide.ctaX,
                      } as React.CSSProperties
                    }
                  >
                    {slide.cta}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </Slider>
    </section>
  );
}
