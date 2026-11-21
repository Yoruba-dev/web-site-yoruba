"use client";

import "@/app/creador-de-relojes/odu-picker.css";
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
  ayuda,
  errorNombre,
}: {
  value: OduSign | null;
  onChange: (s: OduSign | null) => void;
  /** Título del bloque ("Signo en la esfera", "Signo en la tapa"). */
  titulo: string;
  ayuda?: string;
  /** Motivo de validate() para el nombre de la combinación, si lo hay. */
  errorNombre?: string;
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
    <fieldset className="pyj-reloj_odu">
      <legend className="pyj-reloj_grouplabel">{titulo}</legend>
      {ayuda && <p className="pyj-reloj_note">{ayuda}</p>}

      <OptionGroup<Modo>
        label="Tipo de signo"
        hideLabel
        variant="chips"
        value={modo}
        onChange={cambiarModo}
        options={[
          { id: "ninguno", label: "Sin signo" },
          { id: "meyi", label: "Uno de los 16 Meyis" },
          { id: "combinacion", label: "Mi signo es una combinación" },
        ]}
      />

      {modo === "meyi" && (
        <div className="pyj-reloj_meyis">
          <OptionGroup<string>
            label="La tabla de los Meyis"
            hint="En su orden de Ifá. Cada signo se imprime derecho, tal como lo ves."
            value={meyiId}
            onChange={(id) => emitir({ tipo: "meyi", oduId: id })}
            options={ODU_MEJI.map((o) => ({
              id: o.id,
              label: lucumiName(o.id) ?? o.name,
              detalle: o.name,
              visual: (
                <span className="pyj-reloj_meyi">
                  <span className="pyj-reloj_meyinum">{o.number}</span>
                  <OduGlyph odu={o} decorative className="pyj-reloj_meyiglyph" />
                </span>
              ),
            }))}
          />
        </div>
      )}

      {modo === "combinacion" && (
        <div className="pyj-reloj_combo">
          <div className="pyj-reloj_combocols">
            {/* La izquierda a la izquierda y la derecha a la derecha, como se
                dibuja el signo. En el DOM va primero la derecha: se lee primero. */}
            <div className="pyj-reloj_combocol pyj-reloj_combocol--der">
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
            <div className="pyj-reloj_combopreview" aria-live="polite">
              {d && i ? (
                <>
                  <OduGlyph odu={comboOdu(d, i, nombre.trim())} className="pyj-reloj_comboglyph" />
                  <span className="pyj-reloj_combolegs">
                    <span>Izq. {lucumiLeg(i.id)}</span>
                    <span>Der. {lucumiLeg(d.id)}</span>
                  </span>
                </>
              ) : (
                <span className="pyj-reloj_note">Elige las dos piernas de tu signo.</span>
              )}
            </div>
            <div className="pyj-reloj_combocol pyj-reloj_combocol--izq">
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
            <p className="pyj-reloj_note" role="status">
              Con las dos piernas iguales tu signo es un Meyi: <strong>{lucumiName(d.id)}</strong>.
            </p>
          ) : (
            <div className="pyj-reloj_field">
              <label htmlFor={`${uid}-nombre`} className="pyj-reloj_fieldlabel">
                Nombre de tu signo, tal como está en tu libreta <span aria-hidden="true">*</span>
              </label>
              <ComposedInput
                id={`${uid}-nombre`}
                className="pyj-reloj_input"
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
              <span id={`${uid}-nombre-ayuda`} className="pyj-reloj_fieldhelp">
                <span>
                  {rechazado
                    ? "Este carácter no se puede grabar."
                    : d && i && errorNombre
                      ? errorNombre
                      : "Lo escribes tú: nunca lo generamos."}
                </span>
                <span className="pyj-reloj_count">
                  {nombre.length}/{SIGN_NAME_MAX}
                </span>
              </span>
            </div>
          )}
        </div>
      )}

      {modo !== "ninguno" && <p className="pyj-reloj_note pyj-reloj_note--odu">{WATCH_ODU_NOTE}</p>}
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
      variant="tiles"
      value={value}
      onChange={onChange}
      options={ODU_MEJI.map((o) => ({
        id: o.id,
        label: lucumiLeg(o.id) ?? o.name,
        visual: <OduGlyph odu={o} tower={columna} decorative className="pyj-reloj_legglyph" />,
      }))}
    />
  );
}
