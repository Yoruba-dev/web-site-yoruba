"use client";

// ---------------------------------------------------------------------------
// Lo que flota sobre el escenario (spec V2 §3.3 / §3.4): el chip del código
// (clic = copiar el enlace), [Compartir] con su popover, la pista de una vez
// "Las piezas en cristal se colocan en su paso" y el aviso de diseño
// compartido. Solo los controles reciben el puntero; el resto deja pasar los
// gestos al visor.
// ---------------------------------------------------------------------------
import { forwardRef } from "react";
import { Icon } from "./icons";

export const StageChips = forwardRef<
  HTMLDivElement,
  {
    code: string;
    onCopy: () => void;
    onShare: (anchor: HTMLElement) => void;
    shareOpen: boolean;
    compact: boolean;
  }
>(function StageChips({ code, onCopy, onShare, shareOpen, compact }, ref) {
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
