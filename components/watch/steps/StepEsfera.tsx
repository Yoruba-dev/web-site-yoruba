"use client";

import { useId, useState } from "react";
import ComposedInput from "../ComposedInput";
import OptionGroup from "../OptionGroup";
import OduPicker from "../OduPicker";
import { BeadRow, GradientDial, HandSwatch, SolSwatch } from "../Swatches";
import { layerUrl, type SubId } from "../creator-state";
import { preloadWatchLayers } from "../WatchFront";
import { preloadImage } from "../front/preload";
import { PanelOverlay } from "../shell/overlay";
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
  SECONDS,
  TRACKS,
  TRACK_SEQUENCES,
  WATCH_COLORS,
  WATCH_ORISHAS,
  canonicalDialText,
  cleanDialText,
  dialBaseHex,
  dialColorAt,
  getDialBase,
  getFinish,
  getSecondsPart,
  gradientStepOf,
  isGradientStep,
  isPartId,
  optionState,
  orishaName,
  signName,
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
  type SecondsId,
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

/** Paso 2 · Esfera, en 4 sub-pestañas: Color · Pista · Texto · Detalles (las
 *  agujas viven aquí). */
export default function StepEsfera(props: StepProps & { sub: SubId }) {
  const { sub } = props;
  if (sub === "pista") return <EsferaPista {...props} />;
  if (sub === "texto") return <EsferaTexto {...props} />;
  if (sub === "detalles") return <EsferaDetalles {...props} />;
  return <EsferaColor {...props} />;
}

// — Color: modelo, sol, degradado de Orisha y su ajuste ——————————————————
function EsferaColor({ config, dispatch }: StepProps) {
  const e = config.esfera;
  const bases = visibleParts(DIAL_BASES);
  const lisas = bases.filter((b) => !b.degradado);
  const degradados = bases.filter((b) => b.degradado);
  const actual = getDialBase(e.base);
  const grad = actual?.degradado;
  const paso = gradientStepOf(e);
  const baseTile = (b: (typeof bases)[number]) => ({
    id: b.id,
    ...tileState(optionState(config, "esfera", b.id)),
  });

  return (
    <>
      <OptionGroup<DialModelId>
        label="Modelo"
        variant="segmented"
        field="esfera.modelo"
        value={e.modelo}
        onChange={(modelo) => dispatch({ type: "modelo", modelo })}
        options={(Object.keys(DIAL_MODELS) as DialModelId[]).map((id) => ({
          id,
          label: id === "ifa" ? `✦ ${DIAL_MODELS[id].label}` : DIAL_MODELS[id].label,
        }))}
      />

      <OptionGroup<DialBaseId>
        label="Sol"
        labelValue={!grad ? actual?.label : undefined}
        variant="swatches"
        columns={7}
        field="esfera.base"
        value={grad ? null : e.base}
        onChange={(id) => isPartId("esfera", id) && dispatch({ type: "pieza", cat: "esfera", id })}
        onPreview={(id) => previewPart(config, "esfera", id)}
        options={lisas.map((b) => ({
          ...baseTile(b),
          label: b.label,
          visual: <SolSwatch hex={dialBaseHex(b.id)} />,
        }))}
      />

      {degradados.length > 0 && (
        <OptionGroup<DialBaseId>
          label="Degradado de Orisha"
          labelValue={grad ? `${grad.orisha} (${grad.nombres[0]} → ${grad.nombres[1]})` : undefined}
          variant="swatches"
          columns={7}
          value={grad ? e.base : null}
          onChange={(id) => isPartId("esfera", id) && dispatch({ type: "pieza", cat: "esfera", id })}
          onPreview={(id) => previewPart(config, "esfera", id)}
          options={degradados.map((b) => {
            const g = b.degradado!;
            return {
              ...baseTile(b),
              label: `${g.orisha}: ${g.nombres[0]} → ${g.nombres[1]}`,
              visual: <GradientDial esfera={{ base: b.id, degradado: b.id === e.base && paso ? paso : 3 }} size={44} />,
            };
          })}
        />
      )}

      {grad && paso && (
        <div className="rl-paso">
          <OptionGroup<string>
            label="Ajusta el degradado"
            labelValue={pasoLabel(paso, grad)}
            variant="swatches"
            columns={7}
            value={String(paso)}
            onChange={(id) => {
              const n = Number(id);
              if (isGradientStep(n)) dispatch({ type: "degradado", paso: n });
            }}
            onPreview={(id) => {
              const n = Number(id);
              if (!isGradientStep(n)) return;
              void preloadWatchLayers(withGradientStep(config, n));
              const thumb = layerUrl(`esfera-degradado-${grad.key}-p${n}`);
              if (thumb) void preloadImage(thumb);
            }}
            options={DIAL_GRADIENT_STEPS.map((n) => ({
              id: String(n),
              label: pasoLabel(n, grad),
              visual: <GradientDial esfera={{ base: e.base, degradado: n }} size={44} />,
            }))}
          />
        </div>
      )}
    </>
  );
}

// — Pista: estilo + de qué Orisha son las cuentas ——————————————————————
function EsferaPista({ config, dispatch }: StepProps) {
  const e = config.esfera;
  return (
    <>
      <OptionGroup<TrackStyle>
        label="Estilo de la pista"
        variant="segmented"
        field="esfera.pista"
        value={e.pista.estilo}
        onChange={(id) => isPartId("pista", id) && dispatch({ type: "pieza", cat: "pista", id })}
        options={visibleParts(TRACKS).map((t) => ({
          id: t.id,
          label: t.id === "cuentas" ? "Cuentas" : t.label,
          ...tileState(optionState(config, "pista", t.id)),
        }))}
      />
      <OptionGroup<OrishaId | "lisa">
        label="Los colores de"
        labelValue={e.pista.orisha ? orishaName(e.pista.orisha) : "Lisa"}
        variant="rows"
        columns={2}
        value={e.pista.orisha ?? "lisa"}
        onChange={(id) => dispatch({ type: "pistaOrisha", orisha: id === "lisa" ? null : id })}
        options={[
          ...WATCH_ORISHAS.map((o) => ({
            id: o,
            label: orishaName(o),
            detalle: TRACK_SEQUENCES[o].nota.replace(/\.$/, ""),
            visual: <BeadRow orisha={o} count={6} />,
          })),
          {
            id: "lisa" as const,
            label: "Lisa",
            detalle: "Rayas sin color",
            visual: <span className="rl-beads rl-beads--lisa" />,
            ...(e.pista.estilo === "cuentas"
              ? { estado: "bloqueado" as const, motivo: "Las cuentas llevan los colores de un Orisha." }
              : {}),
          },
        ]}
      />
    </>
  );
}

// — Texto a las 6 + el signo (capa) + dónde va ——————————————————————————
function EsferaTexto({ config, dispatch, goTo }: StepProps) {
  const uid = useId();
  const e = config.esfera;
  const canon = canonicalDialText(e);
  const [rechazado, setRechazado] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const issues = validate(config).issues;
  const motivoDe = (campo: string) => issues.find((i) => i.campo === campo && i.nivel === "bloqueo")?.motivo;
  const avisoSigno = issues.find((i) => i.regla === "contraste-signo")?.motivo;
  const errTexto = motivoDe("esfera.texto");

  return (
    <>
      {FLAGS.DIAL_FREE_TEXT && (
        <div className="rl-field" data-field="esfera.texto">
          <div className="rl-field_head">
            <label htmlFor={`${uid}-texto`} className="rl-group_label">
              Texto a las 6
            </label>
            {canon && e.texto !== canon ? (
              <button type="button" className="rl-link" onClick={() => dispatch({ type: "textoCanonico" })}>
                Restaurar {canon}
              </button>
            ) : e.texto !== "" ? (
              <button type="button" className="rl-link" onClick={() => dispatch({ type: "texto", texto: "" })}>
                Sin texto
              </button>
            ) : null}
          </div>
          <ComposedInput
            id={`${uid}-texto`}
            className="rl-input rl-input--dial"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            enterKeyHint="done"
            maxLength={DIAL_TEXT_MAX + 4}
            aria-describedby={`${uid}-texto-ayuda`}
            aria-invalid={!!errTexto}
            value={e.texto}
            placeholder="Sin texto"
            onValue={(typed) => {
              const raw = typed.toLocaleUpperCase("es");
              dispatch({ type: "texto", texto: raw });
              setRechazado(lostChars(raw, cleanDialText(raw), DIAL_TEXT_MAX));
            }}
          />
          <span id={`${uid}-texto-ayuda`} className="rl-field_help">
            <span className={rechazado || errTexto ? "is-error" : undefined}>
              {rechazado ? "Este carácter no se puede imprimir." : (errTexto ?? "Mayúsculas, con tilde y Ñ.")}
            </span>
            <span className="rl-count">
              {[...e.texto].length}/{DIAL_TEXT_MAX}
            </span>
          </span>
        </div>
      )}

      {FLAGS.ODU_ON_DIAL &&
        (e.modelo === "ifa" ? (
          <div className="rl-callout">
            <p>{IFA_SIGN_RULE}</p>
            <button type="button" className="rl-link" onClick={() => goTo("tapa", "signo")}>
              Ir a Tapa › Signo
            </button>
          </div>
        ) : (
          <>
            <OptionGroup<"ninguno" | "signo">
              label="Signo en la esfera"
              hint="Opcional · siempre derecho"
              variant="segmented"
              field="esfera.signo"
              value={e.signo ? "signo" : "ninguno"}
              onChange={(id) => {
                if (id === "ninguno") dispatch({ type: "esferaSigno", signo: null });
                else setAbierto(true);
              }}
              options={[
                { id: "ninguno", label: "Sin signo" },
                { id: "signo", label: e.signo ? signName(e.signo) || "Combinación" : "Elegir signo…" },
              ]}
            />
            {e.signo && (
              <div className="rl-inline">
                <button type="button" className="rl-link" onClick={() => setAbierto(true)}>
                  Cambiar signo
                </button>
                {motivoDe("esfera.signo") && <span className="rl-field_help is-error">{motivoDe("esfera.signo")}</span>}
              </div>
            )}
            {e.signo && (
              <OptionGroup<DialSignPos>
                label="Dónde va"
                variant="segmented"
                value={e.signoPos}
                onChange={(pos) => dispatch({ type: "signoPos", pos })}
                options={[
                  { id: "nueve", label: "A las 9" },
                  { id: "seis", label: "A las 6" },
                ]}
              />
            )}
            {avisoSigno && (
              <p className="rl-note" role="status">
                {avisoSigno}
              </p>
            )}
            <PanelOverlay open={abierto} title="Signo en la esfera" onClose={() => setAbierto(false)}>
              <OduPicker
                titulo="Signo en la esfera"
                ocultarTitulo
                value={e.signo}
                onChange={(signo) => dispatch({ type: "esferaSigno", signo })}
                errorNombre={motivoDe("esfera.signo")}
              />
            </PanelOverlay>
          </>
        ))}
    </>
  );
}

// — Detalles: aplique PY y segundero (lo que antes era "Agujas") —————————————
function EsferaDetalles({ config, dispatch }: StepProps) {
  const finish = getFinish(config.acabado);
  const metal = finish?.metalAgujas === "oro-rosa" ? "oro rosa" : "acero pulido";
  const dialHex = dialColorAt(config.esfera, -9);
  const dialAbajo = dialColorAt(config.esfera, 9);
  return (
    <>
      <OptionGroup<AppliqueId>
        label="Aplique PY"
        hint="Bajo las 12 · incluido"
        variant="tiles"
        columns={3}
        field="aplique"
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
              width={40}
              height={40}
              loading="lazy"
              className="rl-logo"
            />
          ),
          ...tileState(optionState(config, "aplique", a.id)),
        }))}
      />
      <OptionGroup<SecondsId>
        label="Segundero"
        labelValue={getSecondsPart(config.segundero)?.label}
        variant="swatches"
        columns={7}
        field="segundero"
        value={config.segundero}
        onChange={(id) => isPartId("segundero", id) && dispatch({ type: "pieza", cat: "segundero", id })}
        options={visibleParts(SECONDS).map((s) => ({
          id: s.id,
          label: s.label,
          visual: <HandSwatch hex={WATCH_COLORS[s.color].hex} dialHex={dialHex} dialAbajo={dialAbajo} />,
          ...tileState(optionState(config, "segundero", s.id)),
        }))}
      />
      <p className="rl-note">Hora y minuto van en {metal} con lume: siguen el acabado de tu caja.</p>
    </>
  );
}
