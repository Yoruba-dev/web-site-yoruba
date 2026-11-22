"use client";

// ---------------------------------------------------------------------------
// SharePopover (spec V2 §3.7): desde [Compartir] del escenario o el chip del
// código, en cualquier paso. Cristal anclado bajo el botón (escritorio) o
// hoja abajo (móvil): el código en Cinzel 20 oro, los botones de compartir y
// la nota de "solo este equipo". Se cierra con Esc, clic fuera o tras una
// acción; el foco queda atrapado dentro y vuelve al botón que lo abrió.
// ---------------------------------------------------------------------------
import { useEffect, useRef } from "react";
import type { OrderInfo } from "../order";
import ShareButtons from "./ShareButtons";
import { Icon } from "./icons";

export default function SharePopover({
  order,
  file,
  onClose,
  returnFocus,
}: {
  order: OrderInfo;
  file?: File | null;
  onClose: () => void;
  /** A quién devolver el foco al cerrar. */
  returnFocus?: HTMLElement | null;
}) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    el?.querySelector<HTMLElement>("a[href], button")?.focus();
    const onDown = (e: PointerEvent) => {
      if (!el || el.contains(e.target as Node) || returnFocus?.contains(e.target as Node)) return;
      onClose();
    };
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      returnFocus?.focus({ preventScroll: true });
    };
  }, [onClose, returnFocus]);

  return (
    <div
      ref={box}
      className="rl-pop rl-glass"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rl-pop-title"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
          return;
        }
        if (e.key !== "Tab") return;
        // Foco atrapado: Tab da la vuelta dentro del popover.
        const items = [...(box.current?.querySelectorAll<HTMLElement>("a[href], button, input") ?? [])].filter(
          (x) => !x.hasAttribute("disabled"),
        );
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }}
    >
      <div className="rl-pop_head">
        <div>
          <span id="rl-pop-title" className="rl-pop_title">
            Comparte tu diseño
          </span>
          <strong className="rl-pop_code">{order.code}</strong>
        </div>
        <button type="button" className="rl-iconbtn" onClick={onClose} aria-label="Cerrar">
          <Icon name="close" />
        </button>
      </div>
      <p className="rl-pop_lead">Pide la opinión de tu padrino o madrina antes de pedirlo.</p>
      <ShareButtons order={order} file={file} onDone={onClose} compact />
    </div>
  );
}
