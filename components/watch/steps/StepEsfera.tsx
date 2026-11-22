"use client";

import "@/app/creador-de-relojes/degradado.css";
import { useId, useState } from "react";
import ComposedInput from "../ComposedInput";
import OptionGroup from "../OptionGroup";
import OduPicker from "../OduPicker";
import { BeadRow, GradientDial, LayerThumb, swatchHex } from "../Swatches";
import { layerUrl } from "../creator-state";
import { preloadWatchLayers } from "../WatchFront";
import { preloadImage } from "../front/preload";
import { lostChars, tileState, type StepProps } from "./types";
import { previewPart } from "./preview";
import {
  APPLIQUES,
  DIAL_BASES,
  DIAL_GRADIENT_STEPS,
  DIAL_MODELS,
  DIAL_TEXT_MAX,
  FLAGS,
  RULES,
  TRACKS,
  TRACK_SEQUENCES,
  WATCH_ORISHAS,
  canonicalDialText,
  cleanDialText,
  getDialBase,
  gradientStepOf,
  isGradientStep,
  isPartId,
  optionState,
  orishaName,
  validate,
  visibleParts,
  withGradientStep,
  type AppliqueId,
  type DialBaseId,
  type DialGradient,
  type DialGradientStep,
  type DialModelId,
  type DialSignPos,
  type OrishaId,
  type TrackStyle,
} from "@/lib/watch";

const IFA_SIGN_RULE = RULES.find((r) => r.id === "signo-esfera-ifa")?.motivo;

/** Nombre de cada paso del ajuste (lectores de pantalla y la ficha). */
function pasoLabel(n: DialGradientStep, g: DialGradient): string {
  const [arriba, abajo] = g.nombres;
  return n === 3
    ? "Al centro"
    : n < 3
      ? `${n === 1 ? "Mucho" : "Un poco"} más ${arriba}`
      : `${n === 5 ? "Mucho" : "Un poco"} más ${abajo}`;
}

/** Paso 2 · Esfera: modelo, color base, pista, texto a las 6, signo y aplique. */
export default function StepEsfera({ config, dispatch, goTo }: StepProps) {
  const uid = useId();
  const e = config.esfera;
  const canon = canonicalDialText(e);
  const [rechazado, setRechazado] = useState(false);
  const issues = validate(config).issues;
  const motivoDe = (campo: string) => issues.find((i) => i.campo === campo && i.nivel === "bloqueo")?.motivo;
  const avisoSigno = issues.find((i) => i.regla === "contraste-signo")?.motivo;
  const bases = visibleParts(DIAL_BASES);
  const lisas = bases.filter((b) => !b.degradado);
  const degradados = bases.filter((b) => b.degradado);
  const grad = getDialBase(e.base)?.degradado;
  const paso = gradientStepOf(e);
  const baseTile = (b: (typeof bases)[number]) => ({
    id: b.id,
    ...tileState(optionState(config, "esfera", b.id)),
  });

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
        value={grad ? null : e.base}
        onChange={(id) => isPartId("esfera", id) && dispatch({ type: "pieza", cat: "esfera", id })}
        onPreview={(id) => previewPart(config, "esfera", id)}
        options={lisas.map((b) => ({
          ...baseTile(b),
          label: b.label,
          visual: <LayerThumb crop="esfera" layers={[layerUrl(`esfera-${b.id}`)]} fallbackHex={swatchHex(b.swatch)} />,
        }))}
      />

      {/* — Degradado de Orisha (+ su ajuste) ——————————————————————— */}
      {degradados.length > 0 && (
        <OptionGroup<DialBaseId>
          label="Degradado de Orisha"
          hint="Los dos colores de un Orisha, fundidos de arriba abajo con el mismo brillo sol."
          value={grad ? e.base : null}
          onChange={(id) => isPartId("esfera", id) && dispatch({ type: "pieza", cat: "esfera", id })}
          onPreview={(id) => previewPart(config, "esfera", id)}
          options={degradados.map((b) => {
            const g = b.degradado!;
            return {
              ...baseTile(b),
              label: g.orisha,
              detalle: `${g.nombres[0]} → ${g.nombres[1]}`,
              // Solo la elegida sigue el paso; las demás, el del medio (así mover
              // el ajuste no recarga las 11 fotos a la vez).
              visual: (
                <LayerThumb
                  crop="esfera"
                  layers={[layerUrl(`esfera-degradado-${g.key}-p${b.id === e.base && paso ? paso : 3}`)]}
                  fallbackHex={swatchHex(b.swatch)}
                />
              ),
            };
          })}
        />
      )}
      {grad && paso && (
        <div className="pyj-reloj_paso">
          <OptionGroup<string>
            label="Ajusta el degradado"
            hint="Mueve dónde cambia el color. Lo hacemos igual en la esfera."
            value={String(paso)}
            onChange={(id) => {
              const n = Number(id);
              if (isGradientStep(n)) dispatch({ type: "degradado", paso: n });
            }}
            onPreview={(id) => {
              const n = Number(id);
              if (!isGradientStep(n)) return;
              void preloadWatchLayers(withGradientStep(config, n));
              // …y la miniatura de su ficha en ese paso.
              const thumb = layerUrl(`esfera-degradado-${grad.key}-p${n}`);
              if (thumb) void preloadImage(thumb);
            }}
            options={DIAL_GRADIENT_STEPS.map((n) => ({
              id: String(n),
              label: pasoLabel(n, grad),
              visual: <GradientDial esfera={{ base: e.base, degradado: n }} size={36} />,
            }))}
          />
          <div className="pyj-reloj_pasoends" aria-hidden="true">
            <span>← Más {grad.nombres[0]}</span>
            <span>Más {grad.nombres[1]} →</span>
          </div>
        </div>
      )}

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
            {avisoSigno && (
              <p className="pyj-reloj_note" role="status">
                {avisoSigno}
              </p>
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
