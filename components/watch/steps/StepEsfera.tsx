"use client";

import { useId, useState } from "react";
import ComposedInput from "../ComposedInput";
import OptionGroup from "../OptionGroup";
import OduPicker from "../OduPicker";
import { BeadRow, LayerThumb, swatchHex } from "../Swatches";
import { layerUrl } from "../creator-state";
import { lostChars, tileState, type StepProps } from "./types";
import { previewPart } from "./preview";
import {
  APPLIQUES,
  DIAL_BASES,
  DIAL_MODELS,
  DIAL_TEXT_MAX,
  FLAGS,
  RULES,
  TRACKS,
  TRACK_SEQUENCES,
  WATCH_ORISHAS,
  canonicalDialText,
  cleanDialText,
  isPartId,
  optionState,
  orishaName,
  validate,
  visibleParts,
  type AppliqueId,
  type DialBaseId,
  type DialModelId,
  type DialSignPos,
  type OrishaId,
  type TrackStyle,
} from "@/lib/watch";

const IFA_SIGN_RULE = RULES.find((r) => r.id === "signo-esfera-ifa")?.motivo;

/** Paso 2 · Esfera: modelo, color base, pista, texto a las 6, signo y aplique. */
export default function StepEsfera({ config, dispatch, goTo }: StepProps) {
  const uid = useId();
  const e = config.esfera;
  const canon = canonicalDialText(e);
  const [rechazado, setRechazado] = useState(false);
  const issues = validate(config).issues;
  const motivoDe = (campo: string) => issues.find((i) => i.campo === campo && i.nivel === "bloqueo")?.motivo;

  return (
    <>
      {/* — Modelo ——————————————————————————————————————————————— */}
      <OptionGroup<DialModelId>
        label="Modelo de esfera"
        value={e.modelo}
        onChange={(modelo) => dispatch({ type: "modelo", modelo })}
        options={(Object.keys(DIAL_MODELS) as DialModelId[]).map((id) => ({
          id,
          label: DIAL_MODELS[id].label,
          detalle: DIAL_MODELS[id].nota,
          visual: id === "ifa" ? <span className="pyj-reloj_star">✦</span> : undefined,
        }))}
      />

      {/* — Color base ——————————————————————————————————————————— */}
      <OptionGroup<DialBaseId>
        label="Color de la esfera"
        hint="Esfera de acabado sol: el brillo se mueve con la luz."
        value={e.base}
        onChange={(id) => isPartId("esfera", id) && dispatch({ type: "pieza", cat: "esfera", id })}
        onPreview={(id) => previewPart(config, "esfera", id)}
        options={visibleParts(DIAL_BASES).map((b) => ({
          id: b.id,
          label: b.label,
          visual: <LayerThumb crop="esfera" layers={[layerUrl(`esfera-${b.id}`)]} fallbackHex={swatchHex(b.swatch)} />,
          ...tileState(optionState(config, "esfera", b.id)),
        }))}
      />

      {/* — Pista ———————————————————————————————————————————————— */}
      <OptionGroup<TrackStyle>
        label="Pista de minutos"
        hint="Las cuentas de la pista siguen los colores del collar de tu Orisha."
        variant="chips"
        value={e.pista.estilo}
        onChange={(id) => isPartId("pista", id) && dispatch({ type: "pieza", cat: "pista", id })}
        options={visibleParts(TRACKS).map((t) => ({
          id: t.id,
          label: t.label,
          ...tileState(optionState(config, "pista", t.id)),
        }))}
      />
      <OptionGroup<OrishaId | "lisa">
        label="Colores de la pista"
        value={e.pista.orisha ?? "lisa"}
        onChange={(id) => dispatch({ type: "pistaOrisha", orisha: id === "lisa" ? null : id })}
        options={[
          ...WATCH_ORISHAS.map((o) => ({
            id: o,
            label: orishaName(o),
            detalle: TRACK_SEQUENCES[o].nota,
            visual: <BeadRow orisha={o} />,
          })),
          {
            id: "lisa" as const,
            label: "Lisa",
            detalle: "Rayas sin color",
            ...(e.pista.estilo === "cuentas"
              ? { estado: "bloqueado" as const, motivo: "Las cuentas llevan los colores de un Orisha." }
              : {}),
          },
        ]}
      />

      {/* — Texto a las 6 ——————————————————————————————————————— */}
      <div className="pyj-reloj_field">
        <label htmlFor={`${uid}-texto`} className="pyj-reloj_grouplabel">
          Texto a las 6
        </label>
        {FLAGS.DIAL_FREE_TEXT ? (
          <>
            <ComposedInput
              id={`${uid}-texto`}
              className="pyj-reloj_input pyj-reloj_input--dial"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={DIAL_TEXT_MAX + 4}
              aria-describedby={`${uid}-texto-ayuda`}
              aria-invalid={!!motivoDe("esfera.texto")}
              value={e.texto}
              placeholder="Sin texto"
              onValue={(typed) => {
                const raw = typed.toLocaleUpperCase("es");
                dispatch({ type: "texto", texto: raw });
                // Se compara con la versión limpia que guardará el reducer.
                setRechazado(lostChars(raw, cleanDialText(raw), DIAL_TEXT_MAX));
              }}
            />
            <span id={`${uid}-texto-ayuda`} className="pyj-reloj_fieldhelp">
              <span>
                {rechazado
                  ? "Este carácter no se puede imprimir."
                  : (motivoDe("esfera.texto") ?? "Mayúsculas con tilde y Ñ. Te enviamos una prueba antes de imprimir.")}
              </span>
              <span className="pyj-reloj_count">
                {[...e.texto].length}/{DIAL_TEXT_MAX}
              </span>
            </span>
          </>
        ) : null}
        <div className="pyj-reloj_inline">
          {canon && e.texto !== canon && (
            <button type="button" className="pyj-reloj_link" onClick={() => dispatch({ type: "textoCanonico" })}>
              Usar «{canon}»
            </button>
          )}
          {e.texto !== "" && (
            <button type="button" className="pyj-reloj_link" onClick={() => dispatch({ type: "texto", texto: "" })}>
              Sin texto
            </button>
          )}
        </div>
      </div>

      {/* — Signo en la esfera ————————————————————————————————— */}
      {FLAGS.ODU_ON_DIAL &&
        (e.modelo === "ifa" ? (
          <div className="pyj-reloj_callout">
            <p>{IFA_SIGN_RULE}</p>
            <button type="button" className="pyj-reloj_link" onClick={() => goTo("tapa")}>
              Ir a Tu tapa →
            </button>
          </div>
        ) : (
          <>
            <OduPicker
              titulo="Signo en la esfera (opcional)"
              ayuda="Impreso en la esfera, pequeño y siempre derecho respecto a las 12."
              value={e.signo}
              onChange={(signo) => dispatch({ type: "esferaSigno", signo })}
              errorNombre={motivoDe("esfera.signo")}
            />
            {e.signo && (
              <OptionGroup<DialSignPos>
                label="Dónde va el signo"
                variant="chips"
                value={e.signoPos}
                onChange={(pos) => dispatch({ type: "signoPos", pos })}
                options={[
                  { id: "nueve", label: "A las 9", detalle: "En pareja con la fecha" },
                  { id: "seis", label: "A las 6", detalle: "Sobre el texto" },
                ]}
              />
            )}
          </>
        ))}

      {/* — Aplique PY ——————————————————————————————————————————— */}
      <OptionGroup<AppliqueId>
        label="Aplique PY"
        hint="El sello de la casa, aplicado bajo las 12. Incluido."
        value={config.aplique}
        onChange={(id) => isPartId("aplique", id) && dispatch({ type: "pieza", cat: "aplique", id })}
        onPreview={(id) => previewPart(config, "aplique", id)}
        options={visibleParts(APPLIQUES).map((a) => ({
          id: a.id,
          label: a.label,
          visual: (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={a.metal === "oro" ? "/assets/images/reloj/logo-py-256.webp" : "/assets/images/reloj/logo-py-plata-256.webp"}
              alt=""
              width={44}
              height={44}
              loading="lazy"
              className="pyj-reloj_logo"
            />
          ),
          ...tileState(optionState(config, "aplique", a.id)),
        }))}
      />
    </>
  );
}
