"use client";

// ---------------------------------------------------------------------------
// Capa sobre la zona de opciones del panel / de la hoja (spec V2 §3.5, D19):
// el selector de signo de la esfera entra desde la derecha (280 ms) TAPANDO
// las opciones, con "Hecho" arriba. El armazón da el contenedor (un portal), así
// la capa no se desplaza con las opciones ni hace crecer el panel.
// ---------------------------------------------------------------------------
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

export const OverlayHostContext = createContext<HTMLElement | null>(null);

export function PanelOverlay({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const host = useContext(OverlayHostContext);
  const box = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    back.current = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => box.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus());
    return () => {
      cancelAnimationFrame(raf);
      // Al cerrar, el foco vuelve a quien abrió.
      back.current?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open || !host) return null;
  return createPortal(
    <div
      ref={box}
      className="rl-overlay rl-glass"
      role="dialog"
      aria-modal="false"
      aria-label={title}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="rl-overlay_head">
        <span className="rl-overlay_title">{title}</span>
        <button type="button" className="rl-btn rl-btn--outline rl-btn--sm" onClick={onClose} data-autofocus>
          Hecho
        </button>
      </div>
      <div className="rl-overlay_body">{children}</div>
    </div>,
    host,
  );
}
