"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isFocusRoute } from "@/lib/focus-routes";

// Replaces the scroll-top.min.js plugin (#scrollUp). Styled by the template CSS.
export default function ScrollToTop() {
  const [show, setShow] = useState(false);
  // Focus routes (lib/focus-routes.ts — the watch creator) hide it, like the
  // mobile tab bar and the popups: on a phone it sat over the option rails, in
  // thumb reach, and one stray tap threw the user to the top of the page.
  const enfoque = isFocusRoute(usePathname());

  useEffect(() => {
    if (enfoque) return;
    const onScroll = () => setShow(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [enfoque]);

  if (enfoque || !show) return null;

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
