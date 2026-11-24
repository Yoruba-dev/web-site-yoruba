"use client";

// ---------------------------------------------------------------------------
// Sub-pestañas de un paso (Esfera: Color · Pista · Texto · Detalles; Correa:
// Correa · Cierre; Tapa: Signo · Grabado). Un tablist WAI-ARIA: una parada de
// tabulador, flechas, Inicio / Fin. Segmentos iguales con el "pulgar" que se
// desliza (solo transform, spec §6.2). Lo que aún no se ha visto lleva un aro
// hueco de 6 px; lo que hay que resolver, un punto rojo.
// ---------------------------------------------------------------------------
import { useRef, type CSSProperties, type KeyboardEvent } from "react";
import { SUB_LABELS, type SubId } from "../creator-state";

export default function SubTabs({
  subs,
  value,
  onChange,
  panelId,
  idPrefix,
  blocked,
  sinVer,
  label,
}: {
  subs: readonly SubId[];
  value: SubId;
  onChange: (s: SubId) => void;
  /** id del panel que controlan. */
  panelId: string;
  idPrefix: string;
  /** Sub-pestañas con algo que resolver (punto rojo). */
  blocked?: ReadonlySet<SubId>;
  /** Sub-pestañas que aún no se han visto (aro hueco). */
  sinVer?: ReadonlySet<SubId>;
  label: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const i = Math.max(0, subs.indexOf(value));

  function onKey(e: KeyboardEvent<HTMLButtonElement>, k: number) {
    const n = subs.length;
    const to =
      e.key === "ArrowRight" ? (k + 1) % n : e.key === "ArrowLeft" ? (k - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    onChange(subs[to]);
    refs.current[to]?.focus();
  }

  return (
    <div
      className="rl-seg rl-subtabs"
      role="tablist"
      aria-label={label}
      style={{ "--n": subs.length, "--i": i } as CSSProperties}
    >
      <span className="rl-seg_thumb" aria-hidden="true" />
      {subs.map((s, k) => (
        <button
          key={s}
          ref={(el) => {
            refs.current[k] = el;
          }}
          type="button"
          role="tab"
          id={`${idPrefix}-tab-${s}`}
          aria-selected={k === i}
          aria-controls={panelId}
          tabIndex={k === i ? 0 : -1}
          className={`rl-seg_btn${k === i ? " is-on" : ""}`}
          onClick={() => onChange(s)}
          onKeyDown={(e) => onKey(e, k)}
        >
          <span className="rl-seg_label">{SUB_LABELS[s]}</span>
          {blocked?.has(s) ? (
            <>
              <span className="rl-seg_dot" aria-hidden="true" />
              <span className="rl-sr"> (falta resolver algo)</span>
            </>
          ) : sinVer?.has(s) && k !== i ? (
            <>
              <span className="rl-seg_aro" aria-hidden="true" />
              <span className="rl-sr"> (sin ver)</span>
            </>
          ) : null}
        </button>
      ))}
    </div>
  );
}
