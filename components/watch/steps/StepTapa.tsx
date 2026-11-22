"use client";

import { useId, useState } from "react";
import ComposedInput from "../ComposedInput";
import OptionGroup from "../OptionGroup";
import OduPicker from "../OduPicker";
import { useOutline } from "../front/curvas";
import type { SubId } from "../creator-state";
import { lostChars, type StepProps } from "./types";
import { CASEBACK_MAX, cleanCasebackLine, signName, validate, type Tapa } from "@/lib/watch";
import { FONT_STACKS, FONT_STYLES, estimateTextWidth, type DialFont, type TextRun } from "@/lib/watch-art";

/** Paso 4 · Tapa, en 2 sub-pestañas: Signo · Grabado (líneas, fecha y la
 *  letra, con la muestra justo debajo del texto que enseña: R7). */
export default function StepTapa(props: StepProps & { sub: SubId }) {
  return props.sub === "grabado" ? <TapaGrabado {...props} /> : <TapaSigno {...props} />;
}

function TapaSigno({ config, dispatch }: StepProps) {
  const t = config.tapa;
  const issues = validate(config).issues;
  const motivoDe = (campo: string) => issues.find((i) => i.campo === campo && i.nivel === "bloqueo")?.motivo;
  return (
    <>
      <OduPicker
        titulo="Tu signo al dorso"
        ocultarTitulo
        field="tapa.signo"
        value={t.signo}
        onChange={(signo) => dispatch({ type: "tapaSigno", signo })}
        errorNombre={motivoDe("tapa.signo")}
      />
      {t.signo && (
        <OptionGroup<Tapa["marcas"]>
          label="Piernas"
          variant="segmented"
          className="rl-group--inline"
          value={t.marcas}
          onChange={(marcas) => dispatch({ type: "tapaMarcas", marcas })}
          options={[
            { id: "barras", label: "Barras I / II" },
            { id: "libreta", label: "Libreta I / 0" },
          ]}
        />
      )}
    </>
  );
}

function TapaGrabado({ config, dispatch }: StepProps) {
  const uid = useId();
  const t = config.tapa;
  const [rechazo, setRechazo] = useState<{ 1: boolean; 2: boolean }>({ 1: false, 2: false });
  const issues = validate(config).issues;
  const motivoDe = (campo: string) => issues.find((i) => i.campo === campo && i.nivel === "bloqueo")?.motivo;
  // La muestra de la letra: la Línea 1 del cliente, si no el nombre del signo,
  // si no "Omo Orula".
  const muestra = t.linea1.trim() || (t.signo ? signName(t.signo).trim() : "") || "Omo Orula";

  const linea = (n: 1 | 2) => {
    const value = n === 1 ? t.linea1 : t.linea2;
    const id = `${uid}-l${n}`;
    const err = motivoDe(`tapa.linea${n}`);
    const bad = rechazo[n];
    return (
      <div className="rl-field" data-field={`tapa.linea${n}`}>
        <div className="rl-field_head">
          <label htmlFor={id} className="rl-group_label">
            Línea {n}
          </label>
          <span id={`${id}-ayuda`} className={`rl-field_help${bad || err ? " is-error" : ""}`}>
            {bad ? "Este carácter no se puede grabar." : (err ?? "Opcional")}
          </span>
        </div>
        <div className="rl-input_wrap">
          <ComposedInput
            id={id}
            className="rl-input"
            type="text"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="next"
            maxLength={CASEBACK_MAX + 4}
            aria-describedby={`${id}-ayuda`}
            aria-invalid={!!err}
            placeholder={n === 1 ? "Ej.: tu nombre de santo" : "Ej.: tu casa o tu ciudad"}
            value={value}
            onValue={(raw) => {
              setRechazo((r) => ({ ...r, [n]: lostChars(raw, cleanCasebackLine(raw), CASEBACK_MAX) }));
              dispatch({ type: "tapaLinea", linea: n, texto: raw });
            }}
          />
          <span className="rl-count rl-input_count" aria-hidden="true">
            {[...value].length}/{CASEBACK_MAX}
          </span>
        </div>
      </div>
    );
  };

  const errFecha = motivoDe("tapa.fecha");
  return (
    <>
      {linea(1)}
      {linea(2)}

      <div className="rl-field" data-field="tapa.fecha">
        <div className="rl-field_head">
          <label htmlFor={`${uid}-fecha`} className="rl-group_label">
            Fecha
          </label>
          {t.fecha ? (
            <button type="button" className="rl-link" onClick={() => dispatch({ type: "tapaFecha", fecha: "" })}>
              Quitar fecha
            </button>
          ) : (
            <span id={`${uid}-fecha-ayuda`} className={`rl-field_help${errFecha ? " is-error" : ""}`}>
              {errFecha ?? "Opcional · tu Itá o la que elijas"}
            </span>
          )}
        </div>
        <input
          id={`${uid}-fecha`}
          className="rl-input rl-input--date"
          type="date"
          min="1900-01-01"
          max="2100-12-31"
          aria-describedby={t.fecha ? undefined : `${uid}-fecha-ayuda`}
          aria-invalid={!!errFecha}
          value={t.fecha ?? ""}
          onChange={(e) => dispatch({ type: "tapaFecha", fecha: e.target.value })}
        />
      </div>

      <OptionGroup<Tapa["fuente"]>
        label="Letra"
        variant="tiles"
        columns={2}
        className="rl-group--letra"
        value={t.fuente}
        onChange={(fuente) => dispatch({ type: "tapaFuente", fuente })}
        options={[
          { id: "clasica", label: "Clásica · Romana", visual: <LetraMuestra text={muestra} font="py-dial" /> },
          { id: "fina", label: "Fina · Cursiva", visual: <LetraMuestra text={muestra} font="py-dial-fina" /> },
        ]}
      />
    </>
  );
}

/** El texto del cliente en la letra del grabado, con los MISMOS contornos que
 *  se graban (lib/watch-curvas, carga diferida). Hasta que llegan, un <text>
 *  con la fuente de la web: Cinzel o Cormorant Garamond cursiva 500. */
function LetraMuestra({ text, font }: { text: string; font: DialFont }) {
  const outline = useOutline();
  const size = 10;
  const w = Math.max(24, estimateTextWidth(text, font, size) * 1.08 + 4);
  const run: TextRun = {
    kind: "text",
    capa: "grabado",
    text,
    x: 0,
    y: 0,
    font,
    size,
    anchor: "middle",
    letterSpacing: font === "py-dial" ? 0.4 : 0,
    weight: font === "py-dial-fina" ? 500 : 400,
    fill: "currentColor",
  };
  const path = outline?.([run]).find((p) => p.kind === "path");
  return (
    <svg
      className="rl-letra"
      viewBox={`${-w / 2} ${-size * 0.92} ${w} ${size * 1.32}`}
      preserveAspectRatio="xMidYMid meet"
      focusable="false"
      aria-hidden="true"
    >
      {path && path.kind === "path" ? (
        <path d={path.d} fill="currentColor" />
      ) : (
        <text
          x="0"
          y="0"
          textAnchor="middle"
          fontSize={size}
          fontFamily={FONT_STACKS[font]}
          fontStyle={FONT_STYLES[font]}
          fontWeight={font === "py-dial-fina" ? 500 : 400}
          letterSpacing={run.letterSpacing}
          fill="currentColor"
        >
          {text}
        </text>
      )}
    </svg>
  );
}
