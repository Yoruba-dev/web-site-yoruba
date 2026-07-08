"use client";

import { useEffect, useState } from "react";

// Replaces the scroll-top.min.js plugin (#scrollUp). Styled by the template CSS.
export default function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <a
      href="#top"
      id="scrollUp"
      onClick={(e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      <i className="ion-ios-arrow-up" />
    </a>
  );
}
