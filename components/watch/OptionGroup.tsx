"use client";

import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";

// ---------------------------------------------------------------------------
// Grupo de opciones del creador = un radiogroup accesible (patrón WAI-ARIA):
// una sola parada de tabulador por grupo, flechas para moverse (y elegir, como
// un radio nativo), Inicio / Fin, foco visible. Las fichas en gris (agotada,
// bloqueada) se pintan con su motivo en español, no se pueden elegir y las
// flechas las saltan. Donde la ficha no tiene sitio para el motivo (círculos,
// vitrina, filas, segmentado), va a la vista bajo el carril: el aviso de la
// elegida, o el de la bloqueada que se acaba de pulsar (en táctil no hay title).
//
// Variantes (spec V2 §6.1), todas sobre la misma rejilla de 8 px:
//   • tiles     — fichas con muestra + nombre (acabado, aplique, Meyis…);
//   • cards     — tarjetas con foto a sangre (tipo de correa);
//   • rows      — filas de 48 px (las cuentas de cada Orisha);
//   • swatches  — círculos de 44 px (SVG: la web anula los border-radius); el
//                 nombre de la elegida va en la etiqueta del grupo;
//   • vitrina   — la pieza real de pie en una balda de cristal, con su nombre
//                 (decisión 19 del dueño): correas y esferas;
//   • segmented — pista de pastilla con el "pulgar" que se desliza;
//   • chips     — pastillas de texto.
// En la hoja del móvil, tiles y swatches son carriles que se deslizan; la
// elegida se deja siempre a la vista (solo se mueve el carril, nunca la página).
// ---------------------------------------------------------------------------

export type OptionEstado = "disponible" | "aviso" | "agotado" | "bloqueado";

export type OptionVariant = "tiles" | "cards" | "rows" | "swatches" | "vitrina" | "segmented" | "chips";

/** Aire entre la elegida y el borde del carril: asoma la siguiente (≥ 8 px). */
const CARRIL_AIRE = 36;

export interface OptionItem<T extends string> {
  id: T;
  label: string;
  /** Nombre corto a la vista (vitrina); el completo (`label`) es el accesible. */
  nombre?: string;
  /** Muestra (SVG, foto recortada…). */
  visual?: ReactNode;
  /** Línea pequeña bajo el nombre ("Incluido", "9 colores"…). */
  detalle?: string;
  estado?: OptionEstado;
  /** Motivo en español cuando está en gris o con aviso. */
  motivo?: string;
}

export default function OptionGroup<T extends string>({
  label,
  labelValue,
  hint,
  value,
  options,
  onChange,
  variant = "tiles",
  hideLabel = false,
  onPreview,
  columns,
  field,
  className,
  espera,
}: {
  label: ReactNode;
  /** Lo elegido, a la vista en la etiqueta ("2 · Color — Caucho rojo"). */
  labelValue?: string;
  hint?: ReactNode;
  value: T | null | undefined;
  options: readonly OptionItem<T>[];
  onChange: (id: T) => void;
  variant?: OptionVariant;
  hideLabel?: boolean;
  /** Al pasar el ratón / enfocar una ficha (precarga de sus fotos). */
  onPreview?: (id: T) => void;
  /** Columnas de la rejilla (tiles, cards, rows, swatches). */
  columns?: number;
  /** data-field: "Corregir" lleva el foco aquí. */
  field?: string;
  className?: string;
  /** La opción cuya foto aún se está bajando (aro de espera sobre su muestra). */
  espera?: T | null;
}) {
  const uid = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const railRef = useRef<HTMLDivElement>(null);
  /** La opción en gris que se acaba de pulsar: se dice por qué no se puede. */
  const [pulsada, setPulsada] = useState<T | null>(null);
  const usable = (o: OptionItem<T>) => o.estado !== "agotado" && o.estado !== "bloqueado";
  const selectedIndex = options.findIndex((o) => o.id === value);
  // La parada de tabulador: la elegida; si no hay, la primera que se puede usar.
  const tabIndexOf = selectedIndex >= 0 ? selectedIndex : options.findIndex(usable);

  // Carril del móvil: la elegida entera a la vista al abrir y tras cambiar, y
  // que asome la siguiente. Solo rail.scrollLeft: scrollIntoView movería
  // también la hoja o la página.
  useLayoutEffect(() => {
    const rail = railRef.current;
    const el = refs.current[selectedIndex];
    if (!rail || !el || rail.scrollWidth <= rail.clientWidth + 1) return;
    const r = rail.getBoundingClientRect();
    const e = el.getBoundingClientRect();
    const izq = e.left - CARRIL_AIRE - r.left;
    const der = e.right + CARRIL_AIRE - r.right;
    if (izq < 0) rail.scrollLeft += izq;
    else if (der > 0) rail.scrollLeft += der;
  }, [selectedIndex, options.length]);

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
    setPulsada(null);
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
  const swatch = variant === "swatches";
  const vitrina = variant === "vitrina";
  const segmented = variant === "segmented";
  // El motivo en la propia ficha (tiles, cards) o a la vista bajo el carril.
  const enFicha = variant === "tiles" || variant === "cards";
  const elegida = options[selectedIndex];
  const gris = pulsada === null ? undefined : options.find((o) => o.id === pulsada && !usable(o));
  const motivo = enFicha ? undefined : (gris?.motivo ?? (elegida?.estado === "aviso" ? elegida.motivo : undefined));
  // Un aviso nuevo, a la vista (en la media hoja del móvil caía bajo el pie). Solo
  // mueve la zona de opciones, y no al abrir el paso.
  const notaRef = useRef<HTMLParagraphElement>(null);
  const motivoAntes = useRef(motivo);
  useLayoutEffect(() => {
    if (motivoAntes.current === motivo) return;
    motivoAntes.current = motivo;
    const caja = notaRef.current?.closest(".rl-opts");
    if (!motivo || !caja) return;
    const falta = notaRef.current!.getBoundingClientRect().bottom + 28 - caja.getBoundingClientRect().bottom;
    if (falta > 0) caja.scrollTop += falta;
  }, [motivo]);
  const style = {
    ...(columns ? { "--cols": columns } : {}),
    ...(segmented ? { "--n": options.length, "--i": Math.max(0, selectedIndex) } : {}),
  } as CSSProperties;

  return (
    <div className={`rl-group rl-group--${variant}${className ? ` ${className}` : ""}`} data-field={field}>
      <div className={hideLabel ? "rl-sr" : "rl-group_head"}>
        <span id={labelId} className="rl-group_label">
          {label}
          {labelValue && <span className="rl-group_value"> — {labelValue}</span>}
        </span>
        {hint && (
          <span id={hintId} className="rl-group_hint">
            {hint}
          </span>
        )}
      </div>
      <div
        ref={railRef}
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={hintId}
        className={`rl-rail rl-rail--${variant}${segmented ? " rl-seg" : ""}${selectedIndex < 0 && segmented ? " is-empty" : ""}`}
        style={style}
      >
        {segmented && <span className="rl-seg_thumb" aria-hidden="true" />}
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
              aria-label={swatch || vitrina ? `${o.label}${o.detalle ? `, ${o.detalle}` : ""}` : undefined}
              title={swatch || vitrina ? o.motivo ?? o.label : off ? o.motivo : undefined}
              tabIndex={i === tabIndexOf ? 0 : -1}
              className={`rl-opt${segmented ? " rl-seg_btn" : ""}${checked ? " is-on" : ""}${off ? " is-off" : ""}${
                o.estado === "aviso" ? " is-warn" : ""
              }`}
              aria-busy={espera === o.id || undefined}
              onClick={() => {
                setPulsada(off ? o.id : null);
                if (!off && !checked) onChange(o.id);
              }}
              onKeyDown={(e) => onKeyDown(e, i)}
              onPointerEnter={onPreview && !off ? () => onPreview(o.id) : undefined}
              onFocus={onPreview && !off ? () => onPreview(o.id) : undefined}
            >
              {o.visual && (
                <span className="rl-opt_vis" aria-hidden="true">
                  {o.visual}
                  {swatch && (
                    <svg className="rl-opt_ring" viewBox="0 0 52 52" focusable="false">
                      <circle cx="26" cy="26" r="24.5" />
                    </svg>
                  )}
                  {espera === o.id && (
                    <svg className="rl-opt_wait" viewBox="0 0 36 36" focusable="false">
                      <circle cx="18" cy="18" r="15" />
                    </svg>
                  )}
                </span>
              )}
              {!swatch && (
                <span className="rl-opt_txt">
                  <span className="rl-opt_label">{(vitrina && o.nombre) || o.label}</span>
                  {o.detalle && !vitrina && <span className="rl-opt_det">{o.detalle}</span>}
                  {o.motivo && (variant === "tiles" || variant === "cards" || variant === "rows") && (
                    <span id={motivoId} className="rl-opt_why">
                      {o.motivo}
                    </span>
                  )}
                </span>
              )}
              {o.motivo && !(variant === "tiles" || variant === "cards" || variant === "rows") && (
                <span id={motivoId} className="rl-sr">
                  {o.motivo}
                </span>
              )}
              {(variant === "tiles" || variant === "cards" || vitrina) && checked && (
                <span className="rl-opt_badge" aria-hidden="true">
                  <svg viewBox="0 0 18 18" focusable="false">
                    <circle cx="9" cy="9" r="9" />
                    <path d="m5 9.4 2.6 2.6L13 6.4" />
                  </svg>
                </span>
              )}
              {o.estado === "aviso" && <span className="rl-opt_warn" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      {motivo && (
        <p ref={notaRef} className={`rl-note rl-group_note${gris ? "" : " is-warn"}`} role="status">
          {motivo}
        </p>
      )}
    </div>
  );
}
