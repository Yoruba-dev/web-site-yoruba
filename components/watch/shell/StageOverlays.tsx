"use client";

// ---------------------------------------------------------------------------
// Lo que flota sobre el escenario (spec V2 §3.3 / §3.4): el chip del código
// (clic = copiar el enlace), [Compartir] con su popover, [Deshacer] cuando hay
// algo que deshacer, la pista de una vez y el nombre de la pieza bajo el ratón.
// Solo los controles reciben el puntero; el resto deja pasar los gestos al visor.
// ---------------------------------------------------------------------------
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Icon } from "./icons";

export const StageChips = forwardRef<
  HTMLDivElement,
  {
    code: string;
    onCopy: () => void;
    onShare: (anchor: HTMLElement) => void;
    shareOpen: boolean;
    /** Deshacer el último cambio; sin nada que deshacer, sin botón. */
    onUndo?: () => void;
    compact: boolean;
  }
>(function StageChips({ code, onCopy, onShare, shareOpen, onUndo, compact }, ref) {
  return (
    <div ref={ref} className="rl-chips">
      <button
        type="button"
        className="rl-codechip rl-glass rl-glass--over"
        onClick={onCopy}
        aria-label={`Código de diseño ${code}. Copiar el enlace`}
        title="Copiar el enlace de tu diseño"
      >
        {code}
      </button>
      <button
        type="button"
        className={`rl-sharebtn rl-glass rl-glass--over${compact ? " rl-sharebtn--icon" : ""}`}
        aria-haspopup="dialog"
        aria-expanded={shareOpen}
        aria-label={compact ? "Compartir tu diseño" : undefined}
        onClick={(e) => onShare(e.currentTarget)}
      >
        <Icon name="share" />
        {!compact && <span>Compartir</span>}
      </button>
      {onUndo && (
        <button type="button" className="rl-undobtn rl-glass rl-glass--over" onClick={onUndo} aria-label="Deshacer el último cambio" title="Deshacer">
          <Icon name="undo" />
        </button>
      )}
    </div>
  );
});

export function HintChip({ text }: { text: string }) {
  return (
    <p className="rl-hint rl-glass rl-glass--over" role="note">
      <span className="rl-hint_dot" aria-hidden="true" />
      {text}
    </p>
  );
}

export interface PartTipHandle {
  /** El nombre de la pieza junto al puntero (px de la ventana); null lo quita. */
  show(nombre: string | null, x: number, y: number): void;
}

/** El nombre de la pieza 3D bajo el ratón. Lleva su propio estado (se mueve
 *  hasta 10 veces por segundo y el editor entero no debe repintarse). Es solo
 *  visual: la pieza ya se elige también desde los pasos. */
export const PartTip = forwardRef<PartTipHandle>(function PartTip(_, ref) {
  const box = useRef<HTMLSpanElement>(null);
  const [tip, setTip] = useState<{ nombre: string; x: number; y: number } | null>(null);
  useImperativeHandle(
    ref,
    () => ({
      show(nombre, x, y) {
        const r = box.current?.parentElement?.getBoundingClientRect();
        setTip(nombre && r ? { nombre, x: x - r.left, y: y - r.top } : null);
      },
    }),
    [],
  );
  return (
    <span
      ref={box}
      className={`rl-parttip${tip ? " is-on" : ""}`}
      aria-hidden="true"
      style={tip ? { transform: `translate(${tip.x}px, ${tip.y}px) translate(-50%, -100%)` } : undefined}
    >
      {tip?.nombre}
    </span>
  );
});
