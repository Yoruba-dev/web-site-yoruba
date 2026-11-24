"use client";

// ---------------------------------------------------------------------------
// El popover de cristal del creador (compartir, ayuda): anclado bajo la cabecera
// en escritorio, hoja abajo en el móvil. role=dialog; se cierra con Esc o con un
// clic fuera; el foco queda atrapado dentro y vuelve al botón que lo abrió.
// ---------------------------------------------------------------------------
import { useEffect, useRef, type ReactNode } from "react";

export default function Popover({
  titleId,
  className,
  onClose,
  returnFocus,
  children,
}: {
  /** id del título (aria-labelledby). */
  titleId: string;
  className?: string;
  onClose: () => void;
  /** A quién devolver el foco al cerrar. */
  returnFocus?: HTMLElement | null;
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  // Lo último de cada prop, en refs: el efecto de foco corre UNA vez por
  // apertura. Si dependiera de `onClose` (una función nueva en cada pintado
  // del editor), cualquier re-pintado mientras está abierto (la pista que se
  // va, el 3D que termina de cargar, la foto de "Listo", el teclado) devolvía
  // el foco a "Cerrar" en mitad de "Copiar enlace".
  const onCloseRef = useRef(onClose);
  const returnRef = useRef(returnFocus);
  useEffect(() => {
    onCloseRef.current = onClose;
    returnRef.current = returnFocus;
  });

  useEffect(() => {
    const el = box.current;
    el?.querySelector<HTMLElement>("a[href], button")?.focus();
    const onDown = (e: PointerEvent) => {
      if (!el || el.contains(e.target as Node) || returnRef.current?.contains(e.target as Node)) return;
      onCloseRef.current();
    };
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      returnRef.current?.focus({ preventScroll: true });
    };
  }, []);

  return (
    <div
      ref={box}
      className={`rl-pop rl-glass${className ? ` ${className}` : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
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
      {children}
    </div>
  );
}
