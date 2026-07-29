"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Slider, { type Settings } from "react-slick";
import { SITE } from "@/lib/site";

const BANNER_DIR = "/assets/images/hero/banner";
// Phones get the SAME artwork, cropped to the half the piece lives in (the copy
// half is dropped — its text is baked in and would be unreadable at 375px).
const MOBILE_DIR = "/assets/images/hero/movil";

/**
 * Paints the phrases the original artwork sets in gold, so the HTML subtitle
 * reads like the banner instead of a flat line of white text. Splits on the
 * exact phrases rather than styling by position, so re-wording one slide can
 * never silently gild the wrong words.
 */
function goldenPhrases(text: string, gold: readonly string[]) {
  if (!gold.length) return text;
  const pattern = gold
    .map((g) => g.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  return text.split(new RegExp(`(${pattern})`, "g")).map((part, i) =>
    gold.includes(part) ? <b key={i}>{part}</b> : part,
  );
}
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
  // A true CROSS-DISSOLVE: two opacities crossing at a constant rate, which is
  // why the easing is `linear`. The old expo-out curve did most of the fade in
  // the first ~300ms and then crawled, so a full-bleed photograph appeared to
  // snap in and then hang — the "cambio brusco". 2s over 5.5s of hold reads as
  // deliberate rather than hurried.
  speed: 2000,
  cssEase: "linear",
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
    <section
      className="pyj-hero"
      aria-roledescription="carrusel"
      aria-label="Destacados"
    >
      <Slider {...settings} className="main-slider">
        {SITE.heroSlides.map((slide, i) => {
          const show = i === 0 || restReady;
          return (
            <div key={slide.banner} className="pyj-hero_slide">
              <div
                className={`pyj-hero_stage pyj-hero_stage--${slide.align}`}
                role="group"
                aria-roledescription="diapositiva"
                aria-label={`${i + 1} de ${SITE.heroSlides.length}: ${slide.title}`}
              >
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
                    {/* phones: the same photograph, cropped to the piece */}
                    <source
                      media="(max-width: 767px)"
                      type="image/avif"
                      srcSet={`${MOBILE_DIR}/${slide.banner}.avif`}
                    />
                    <source
                      media="(max-width: 767px)"
                      type="image/webp"
                      srcSet={`${MOBILE_DIR}/${slide.banner}.webp`}
                    />
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
                    is visually hidden rather than removed.

                    NOT a heading. These are promotional lines, not document
                    structure, and as <h2> they wrecked the page outline: seven of
                    them, four saying the same thing, and that same sentence is
                    already a real <h2> further down the page — five identical
                    <h2>s on one URL. The copy is indexed exactly the same as a
                    <p>; what changes is that the outline now reflects the page. */}
                <div className="pyj-hero_copy">
                  <p className="pyj-hero_title">{slide.title}</p>
                  <p className="pyj-hero_text">
                    {goldenPhrases(slide.text, slide.oro)}
                  </p>
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
