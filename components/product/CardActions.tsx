"use client";

import { useEffect, useRef, useState } from "react";

// The action cluster over a product card's photo (cart / compare / quick-view),
// used by EVERY card surface via ProductCard.
//
// Touch devices: the actions stay collapsed behind a small ⋯ button pinned to
// the photo's corner and slide out SIDEWAYS when tapped — so nothing covers the
// piece by default. Tapping anywhere else collapses them again.
// Desktop: the ⋯ toggle is hidden by CSS and the actions keep the template's
// hover reveal, exactly as before.
//
// The dots are drawn with CSS spans (font-independent — icon fonts have
// silently failed to render on this project before).
export default function CardActions({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Tapping outside the cluster collapses it.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div
      ref={ref}
      className={`add-actions pyj-actions${open ? " is-open" : ""}`}
    >
      <ul>{children}</ul>
      <button
        type="button"
        className="pyj-actions-toggle"
        aria-expanded={open}
        aria-label={open ? "Cerrar opciones" : "Opciones del producto"}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="pyj-dot" />
        <span className="pyj-dot" />
        <span className="pyj-dot" />
      </button>
    </div>
  );
}
