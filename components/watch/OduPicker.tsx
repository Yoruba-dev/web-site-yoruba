"use client";

import { useEffect, useId, useRef, useState } from "react";
import OduGlyph from "@/components/configurator/OduGlyph";
import ComposedInput from "./ComposedInput";
import OptionGroup from "./OptionGroup";
import { ODU_MEJI, getOdu, lucumiLeg, lucumiName, type Odu } from "@/lib/odu";
import { SIGN_NAME_MAX, WATCH_ODU_NOTE, cleanSignName, type OduSign } from "@/lib/watch";

// ---------------------------------------------------------------------------
// LA TABLA DE LOS MEYIS + "Mi signo es una combinación".
//
// • Los 16 Meyis en una rejilla de 4 × 4, en su orden de Ifá (Baba Ejiogbe
//   primero), cada uno DERECHO y sin espejo (OduGlyph → oduMarks, la misma
//   geometría que la esfera y el láser): nombre lucumí grande, yoruba pequeño y
//   su número en el orden de Ifá. Nunca números del diloggún.
// • Combinación: la pierna DERECHA (se lee primero) a la derecha del dibujo, la
//   izquierda a la izquierda, cada una elegida entre las 16 piernas; y el nombre
//   lo ESCRIBE el cliente tal como está en su libreta. Nunca se genera, y no
//   hay ninguna función de "calcula tu signo".
// ---------------------------------------------------------------------------

type Modo = "ninguno" | "meyi" | "combinacion";

/** Un Odù "de mentira" para que OduGlyph dibuje una combinación: la columna
 *  izquierda de una pierna y la derecha de la otra. */
function comboOdu(derecha: Odu, izquierda: Odu, nombre: string): Odu {
  return {
    id: `${derecha.id}+${izquierda.id}`,
    number: 0,
    name: nombre || `${lucumiLeg(derecha.id)} ${lucumiLeg(izquierda.id)}`,
    left: izquierda.left,
    right: derecha.right,
    note: "",
  };
}

export default function OduPicker({
  value,
  onChange,
  titulo,
  ocultarTitulo = false,
  ayuda,
  errorNombre,
  field,
}: {
  value: OduSign | null;
  onChange: (s: OduSign | null) => void;
  /** Título del bloque ("Signo en la esfera", "Signo en la tapa"). */
  titulo: string;
  /** El título ya lo pinta quien lo contiene (la capa de la esfera): solo
   *  para lectores de pantalla. */
  ocultarTitulo?: boolean;
  ayuda?: string;
  /** Motivo de validate() para el nombre de la combinación, si lo hay. */
  errorNombre?: string;
  /** data-field ("tapa.signo"): "Corregir" lleva el foco aquí (al nombre de
   *  la combinación si está a la vista). */
  field?: string;
}) {
  const uid = useId();
  const modoDe = (v: OduSign | null): Modo => (v ? (v.tipo === "meyi" ? "meyi" : "combinacion") : "ninguno");
  const [modo, setModo] = useState<Modo>(modoDe(value));
  // Borrador de la combinación (las piernas pueden estar a medio elegir).
  const [derecha, setDerecha] = useState<string | null>(value?.tipo === "combinacion" ? value.derecha : null);
  const [izquierda, setIzquierda] = useState<string | null>(value?.tipo === "combinacion" ? value.izquierda : null);
  const [nombre, setNombre] = useState(value?.tipo === "combinacion" ? value.nombre : "");
  const [rechazado, setRechazado] = useState(false);

  // Lo último que este picker mandó hacia arriba. Si `value` llega distinto, el
  // cambio vino de fuera (otro preset, un enlace, "Empezar de nuevo") y el
  // picker se pone al día; si es lo suyo, no toca nada (así una combinación
  // con las dos piernas iguales, que se guarda como Meyi, sigue en su modo).
  const emitido = useRef<OduSign | null | undefined>(undefined);
  const emitir = (s: OduSign | null) => {
    emitido.current = s;
    onChange(s);
  };
  useEffect(() => {
    if (value === emitido.current) return;
    emitido.current = value;
    setModo(modoDe(value));
    setDerecha(value?.tipo === "combinacion" ? value.derecha : null);
    setIzquierda(value?.tipo === "combinacion" ? value.izquierda : null);
    setNombre(value?.tipo === "combinacion" ? value.nombre : "");
  }, [value]);

  function emitirCombo(d: string | null, i: string | null, n: string) {
    if (!d || !i) {
      emitir(null);
      return;
    }
    // Dos piernas iguales SON un Meyi (y su nombre es fijo).
    emitir(d === i ? { tipo: "meyi", oduId: d } : { tipo: "combinacion", derecha: d, izquierda: i, nombre: n });
  }

  function cambiarModo(m: Modo) {
    setModo(m);
    if (m === "ninguno") emitir(null);
    else if (m === "meyi") emitir(value?.tipo === "meyi" ? value : null);
    else emitirCombo(derecha, izquierda, nombre);
  }

  const meyiId = value?.tipo === "meyi" && modo === "meyi" ? value.oduId : null;
  const d = derecha ? getOdu(derecha) : undefined;
  const i = izquierda ? getOdu(izquierda) : undefined;
  const mismaPierna = !!d && !!i && d.id === i.id;

  return (
    <fieldset className="rl-odu" data-field={field}>
      <legend className={ocultarTitulo ? "rl-sr" : "rl-group_label"}>{titulo}</legend>
      {ayuda && <p className="rl-note">{ayuda}</p>}

      <OptionGroup<Modo>
        label="Tipo de signo"
        hideLabel
        variant="segmented"
        value={modo}
        onChange={cambiarModo}
        options={[
          { id: "ninguno", label: "Sin signo" },
          { id: "meyi", label: "16 Meyis" },
          { id: "combinacion", label: "Combinación" },
        ]}
      />

      {modo === "meyi" && (
        <div className="rl-meyis">
          <OptionGroup<string>
            label="Los 16 Meyis, en su orden de Ifá"
            hideLabel
            variant="tiles"
            columns={4}
            value={meyiId}
            onChange={(id) => emitir({ tipo: "meyi", oduId: id })}
            options={ODU_MEJI.map((o) => ({
              id: o.id,
              label: lucumiName(o.id) ?? o.name,
              visual: (
                <span className="rl-meyi" title={o.name}>
                  <span className="rl-meyi_num">{o.number}</span>
                  <OduGlyph odu={o} decorative className="rl-meyi_glyph" />
                </span>
              ),
            }))}
          />
        </div>
      )}

      {modo === "combinacion" && (
        <div className="rl-combo">
          <div className="rl-combo_cols">
            {/* La izquierda a la izquierda y la derecha a la derecha, como se
                dibuja el signo. En el DOM va primero la derecha: se lee primero. */}
            <div className="rl-combo_col rl-combo_col--der">
              <LegPicker
                label="Derecha"
                hint="Se lee primero"
                value={derecha}
                onChange={(id) => {
                  setDerecha(id);
                  emitirCombo(id, izquierda, nombre);
                }}
                columna="right"
              />
            </div>
            <div className="rl-combo_preview" aria-live="polite">
              {d && i ? (
                <>
                  <OduGlyph odu={comboOdu(d, i, nombre.trim())} className="rl-combo_glyph" />
                  <span className="rl-combo_legs">
                    <span>Izq. {lucumiLeg(i.id)}</span>
                    <span>Der. {lucumiLeg(d.id)}</span>
                  </span>
                </>
              ) : (
                <span className="rl-note">Elige las dos piernas de tu signo.</span>
              )}
            </div>
            <div className="rl-combo_col rl-combo_col--izq">
              <LegPicker
                label="Izquierda"
                hint="Se lee después"
                value={izquierda}
                onChange={(id) => {
                  setIzquierda(id);
                  emitirCombo(derecha, id, nombre);
                }}
                columna="left"
              />
            </div>
          </div>

          {mismaPierna ? (
            <p className="rl-note" role="status">
              Con las dos piernas iguales tu signo es un Meyi: <strong>{lucumiName(d.id)}</strong>.
            </p>
          ) : (
            <div className="rl-field">
              <label htmlFor={`${uid}-nombre`} className="rl-group_label">
                Nombre, tal como está en tu libreta <span aria-hidden="true">*</span>
              </label>
              <ComposedInput
                id={`${uid}-nombre`}
                className="rl-input"
                type="text"
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                required
                aria-required="true"
                aria-invalid={!!errorNombre && !!d && !!i}
                aria-describedby={`${uid}-nombre-ayuda`}
                maxLength={SIGN_NAME_MAX + 4}
                value={nombre}
                onValue={(raw) => {
                  const limpio = cleanSignName(raw);
                  setRechazado(limpio.length < Math.min(raw.normalize("NFC").replace(/\s+/g, " ").length, SIGN_NAME_MAX));
                  setNombre(limpio);
                  emitirCombo(derecha, izquierda, limpio);
                }}
              />
              <span id={`${uid}-nombre-ayuda`} className="rl-field_help">
                <span className={d && i && errorNombre ? "is-error" : undefined}>
                  {rechazado
                    ? "Este carácter no se puede grabar."
                    : d && i && errorNombre
                      ? errorNombre
                      : "Lo escribes tú: nunca lo generamos."}
                </span>
                <span className="rl-count">
                  {nombre.length}/{SIGN_NAME_MAX}
                </span>
              </span>
            </div>
          )}
        </div>
      )}

      {modo !== "ninguno" && <p className="rl-note rl-note--odu">{WATCH_ODU_NOTE}</p>}
    </fieldset>
  );
}

/** Las 16 piernas, cada una dibujada como UNA columna (la "torre"). */
function LegPicker({
  label,
  hint,
  value,
  onChange,
  columna,
}: {
  label: string;
  /** Misma estructura en las dos piernas para que las cabeceras queden parejas. */
  hint: string;
  value: string | null;
  onChange: (id: string) => void;
  columna: "left" | "right";
}) {
  return (
    <OptionGroup<string>
      label={label}
      hint={hint}
      variant="rows"
      columns={2}
      value={value}
      onChange={onChange}
      options={ODU_MEJI.map((o) => ({
        id: o.id,
        label: lucumiLeg(o.id) ?? o.name,
        visual: <OduGlyph odu={o} tower={columna} decorative className="rl-leg_glyph" />,
      }))}
    />
  );
}
