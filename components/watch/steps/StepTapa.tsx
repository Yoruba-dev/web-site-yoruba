"use client";

import { useId, useState } from "react";
import ComposedInput from "../ComposedInput";
import OptionGroup from "../OptionGroup";
import OduPicker from "../OduPicker";
import { lostChars, type StepProps } from "./types";
import { CASEBACK_MAX, cleanCasebackLine, validate, type Tapa } from "@/lib/watch";

/** Paso 5 · Tu tapa: el signo al dorso, las marcas, dos líneas, fecha y fuente. */
export default function StepTapa({ config, dispatch }: StepProps) {
  const uid = useId();
  const t = config.tapa;
  const [rechazo, setRechazo] = useState<{ 1: boolean; 2: boolean }>({ 1: false, 2: false });
  const issues = validate(config).issues;
  const motivoDe = (campo: string) => issues.find((i) => i.campo === campo && i.nivel === "bloqueo")?.motivo;

  const linea = (n: 1 | 2) => {
    const value = n === 1 ? t.linea1 : t.linea2;
    const id = `${uid}-l${n}`;
    const err = motivoDe(`tapa.linea${n}`);
    return (
      <div className="pyj-reloj_field">
        <label htmlFor={id} className="pyj-reloj_fieldlabel">
          Línea {n} <span className="pyj-reloj_opt-tag">(opcional)</span>
        </label>
        <ComposedInput
          id={id}
          className="pyj-reloj_input"
          type="text"
          autoComplete="off"
          spellCheck={false}
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
        <span id={`${id}-ayuda`} className="pyj-reloj_fieldhelp">
          <span>{rechazo[n] ? "Este carácter no se puede grabar." : (err ?? "")}</span>
          <span className="pyj-reloj_count">
            {[...value].length}/{CASEBACK_MAX}
          </span>
        </span>
      </div>
    );
  };

  return (
    <>
      <p className="pyj-reloj_lead">
        Grabado láser en la tapa: lo personal va por dentro, cerca de la piel. Se graba de pie respecto a las 12,
        tal como lo ves aquí.
      </p>

      <OduPicker
        titulo="Tu signo al dorso"
        value={t.signo}
        onChange={(signo) => dispatch({ type: "tapaSigno", signo })}
        errorNombre={motivoDe("tapa.signo")}
      />

      {t.signo && (
        <OptionGroup<Tapa["marcas"]>
          label="Cómo se marcan las piernas"
          variant="chips"
          value={t.marcas}
          onChange={(marcas) => dispatch({ type: "tapaMarcas", marcas })}
          options={[
            { id: "barras", label: "Barras I / II", detalle: "Como en el tablero" },
            { id: "libreta", label: "Libreta I / 0", detalle: "Como se escribe en la libreta" },
          ]}
        />
      )}

      {linea(1)}
      {linea(2)}

      <div className="pyj-reloj_field">
        <label htmlFor={`${uid}-fecha`} className="pyj-reloj_fieldlabel">
          Fecha <span className="pyj-reloj_opt-tag">(opcional)</span>
        </label>
        <input
          id={`${uid}-fecha`}
          className="pyj-reloj_input pyj-reloj_input--date"
          type="date"
          min="1900-01-01"
          max="2100-12-31"
          aria-describedby={`${uid}-fecha-ayuda`}
          aria-invalid={!!motivoDe("tapa.fecha")}
          value={t.fecha ?? ""}
          onChange={(e) => dispatch({ type: "tapaFecha", fecha: e.target.value })}
        />
        <span id={`${uid}-fecha-ayuda`} className="pyj-reloj_fieldhelp">
          <span>{motivoDe("tapa.fecha") ?? "Tu Itá, tu Mano de Orula o la que tú elijas."}</span>
          {t.fecha && (
            <button type="button" className="pyj-reloj_link" onClick={() => dispatch({ type: "tapaFecha", fecha: "" })}>
              Quitar fecha
            </button>
          )}
        </span>
      </div>

      <OptionGroup<Tapa["fuente"]>
        label="Letra del grabado"
        variant="chips"
        value={t.fuente}
        onChange={(fuente) => dispatch({ type: "tapaFuente", fuente })}
        options={[
          { id: "clasica", label: "Clásica", detalle: "Mayúsculas romanas" },
          { id: "fina", label: "Fina", detalle: "Cursiva elegante" },
        ]}
      />
    </>
  );
}
