"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";

// ---------------------------------------------------------------------------
// Grupo de opciones del creador = un radiogroup accesible (patrón WAI-ARIA):
// una sola parada de tabulador por grupo, flechas para moverse (y elegir, como
// un radio nativo), Inicio / Fin, foco visible. Las fichas en gris (agotada,
// bloqueada) se pintan con su motivo en español, no se pueden elegir y las
// flechas las saltan. En el móvil el mismo grupo se vuelve un carril
// horizontal (CSS: .pyj-reloj_rail).
// ---------------------------------------------------------------------------

export type OptionEstado = "disponible" | "aviso" | "agotado" | "bloqueado";

export interface OptionItem<T extends string> {
  id: T;
  label: string;
  /** Muestra (SVG, foto recortada…). */
  visual?: ReactNode;
  /** Línea pequeña bajo el nombre ("Incluido", "Pendiente de taller"…). */
  detalle?: string;
  estado?: OptionEstado;
  /** Motivo en español cuando está en gris o con aviso. */
  motivo?: string;
}

export default function OptionGroup<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
  variant = "tiles",
  hideLabel = false,
  onPreview,
}: {
  label: string;
  hint?: ReactNode;
  value: T | null | undefined;
  options: readonly OptionItem<T>[];
  onChange: (id: T) => void;
  /** 'tiles' = fichas con muestra; 'chips' = pastillas de texto. */
  variant?: "tiles" | "chips";
  hideLabel?: boolean;
  /** Al pasar el ratón / enfocar una ficha (precarga de sus fotos). */
  onPreview?: (id: T) => void;
}) {
  const uid = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const usable = (o: OptionItem<T>) => o.estado !== "agotado" && o.estado !== "bloqueado";
  const selectedIndex = options.findIndex((o) => o.id === value);
  // La parada de tabulador: la elegida; si no hay, la primera que se puede usar.
  const tabIndexOf = selectedIndex >= 0 ? selectedIndex : options.findIndex(usable);

  function move(from: number, dir: 1 | -1 | "first" | "last") {
    const n = options.length;
    const order =
      dir === "first"
        ? options.map((_, i) => i)
        : dir === "last"
          ? options.map((_, i) => n - 1 - i)
          : Array.from({ length: n - 1 }, (_, k) => (from + dir * (k + 1) + n * 2) % n);
    const to = order.find((i) => usable(options[i]));
    if (to === undefined) return;
    refs.current[to]?.focus();
    if (options[to].id !== value) onChange(options[to].id);
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const keys: Record<string, 1 | -1 | "first" | "last"> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
      Home: "first",
      End: "last",
    };
    const dir = keys[e.key];
    if (dir === undefined) return;
    e.preventDefault();
    move(i, dir);
  }

  const labelId = `${uid}-l`;
  const hintId = hint ? `${uid}-h` : undefined;

  return (
    <div className={`pyj-reloj_group pyj-reloj_group--${variant}`}>
      <div className={hideLabel ? "pyj-reloj_sr" : "pyj-reloj_grouphead"}>
        <span id={labelId} className="pyj-reloj_grouplabel">
          {label}
        </span>
        {hint && (
          <span id={hintId} className="pyj-reloj_grouphint">
            {hint}
          </span>
        )}
      </div>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={hintId}
        className={`pyj-reloj_rail pyj-reloj_rail--${variant}`}
      >
        {options.map((o, i) => {
          const checked = i === selectedIndex;
          const off = !usable(o);
          const motivoId = o.motivo ? `${uid}-m${i}` : undefined;
          return (
            <button
              key={o.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-disabled={off || undefined}
              aria-describedby={motivoId}
              tabIndex={i === tabIndexOf ? 0 : -1}
              className={`pyj-reloj_opt${checked ? " is-on" : ""}${off ? " is-off" : ""}${
                o.estado === "aviso" ? " is-warn" : ""
              }`}
              onClick={() => {
                if (!off && !checked) onChange(o.id);
              }}
              onKeyDown={(e) => onKeyDown(e, i)}
              onPointerEnter={onPreview && !off ? () => onPreview(o.id) : undefined}
              onFocus={onPreview && !off ? () => onPreview(o.id) : undefined}
            >
              {o.visual && (
                <span className="pyj-reloj_optvis" aria-hidden="true">
                  {o.visual}
                </span>
              )}
              <span className="pyj-reloj_opttxt">
                <span className="pyj-reloj_optlabel">{o.label}</span>
                {o.detalle && <span className="pyj-reloj_optdet">{o.detalle}</span>}
                {o.motivo && (
                  <span id={motivoId} className="pyj-reloj_optwhy">
                    {o.motivo}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
