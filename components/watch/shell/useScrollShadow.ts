"use client";

// La sombra de 12 px arriba / abajo de la zona de opciones, SOLO cuando se
// desplaza (spec V2 §3.3). Escribe data-scroll en el elemento ("none", "top",
// "mid", "end"); el CSS pinta la máscara. Sin estado de React: no re-pinta.
import { useCallback, useRef } from "react";

export function useScrollShadow(): (el: HTMLElement | null) => void {
  const cleanup = useRef<(() => void) | null>(null);
  return useCallback((el: HTMLElement | null) => {
    cleanup.current?.();
    cleanup.current = null;
    if (!el) return;
    let raf = 0;
    const set = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const room = el.scrollHeight - el.clientHeight;
        const v = room <= 1 ? "none" : el.scrollTop <= 1 ? "top" : el.scrollTop >= room - 1 ? "end" : "mid";
        if (el.dataset.scroll !== v) el.dataset.scroll = v;
      });
    };
    set();
    el.addEventListener("scroll", set, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(set) : null;
    ro?.observe(el);
    const mo = typeof MutationObserver !== "undefined" ? new MutationObserver(set) : null;
    mo?.observe(el, { childList: true, subtree: true });
    cleanup.current = () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", set);
      ro?.disconnect();
      mo?.disconnect();
    };
  }, []);
}
