"use client";

// ---------------------------------------------------------------------------
// La barra de pasos (spec V2 §3.3 / §6.1): UNA fila de 5 segmentos iguales: la
// pieza del paso (icono de 18 px), su nombre y una barra de 3 px. No depende del
// color (PLAN-REALISMO-V3 6.9): lo hecho lleva un ✓, el actual va en oro y con
// la barra llena, y lo pendiente baja al 60 %. Un paso al que se llegó saltando
// (con partes sin ver) no está hecho: lleva un aro hueco. Un punto rojo de 6 px = algo que
// resolver en ese paso. Todos se pueden pulsar, en cualquier orden. En la hoja
// del móvil van los iconos con su barra y la etiqueta "Correa · 3 de 4".
// ---------------------------------------------------------------------------
import { BUILD_STEPS, STEPS, stepIndex, type StepId } from "../creator-state";
import { Icon, type IconName } from "./icons";

const ICONO: Readonly<Record<StepId, IconName>> = {
  caja: "caja",
  esfera: "esfera",
  correa: "correa",
  tapa: "tapa",
  resumen: "listo",
};

export default function Stepper({
  step,
  max,
  blocked,
  sinVer,
  onGo,
  compact = false,
}: {
  step: StepId;
  /** Paso más alto alcanzado. */
  max: number;
  /** Pasos con algo que resolver (punto rojo). */
  blocked: ReadonlySet<StepId>;
  /** Pasos alcanzados con alguna parte sin ver (aro hueco, no ✓). */
  sinVer: ReadonlySet<StepId>;
  onGo: (s: StepId) => void;
  /** Hoja del móvil: barras + "Paso · n de 4". */
  compact?: boolean;
}) {
  const i = stepIndex(step);
  return (
    <nav className={`rl-stepper${compact ? " rl-stepper--compact" : ""}`} aria-label="Pasos del diseño">
      <ol>
        {STEPS.map((s, k) => {
          const state = k === i ? "now" : k > max ? "todo" : sinVer.has(s.id) ? "part" : "done";
          const falta = blocked.has(s.id);
          const dicho = state === "done" ? " (hecho)" : state === "part" ? " (sin ver del todo)" : "";
          return (
            <li key={s.id}>
              <button
                type="button"
                className={`rl-stepper_btn is-${state}`}
                aria-current={k === i ? "step" : undefined}
                aria-label={compact ? `${s.label}${dicho}${falta ? " (falta resolver algo)" : ""}` : undefined}
                onClick={() => onGo(s.id)}
              >
                <span className="rl-stepper_ico" aria-hidden="true">
                  <Icon name={ICONO[s.id]} size={18} />
                  {state === "done" && (
                    <svg className="rl-stepper_ok" viewBox="0 0 10 10" focusable="false">
                      <circle cx="5" cy="5" r="5" />
                      <path d="m2.6 5.2 1.7 1.7L7.5 3.4" />
                    </svg>
                  )}
                  {state === "part" && <span className="rl-stepper_aro" />}
                </span>
                <span className="rl-stepper_bar" aria-hidden="true">
                  <span className="rl-stepper_fill" />
                </span>
                {!compact && (
                  <span className="rl-stepper_label">
                    {s.label}
                    {dicho && <span className="rl-sr">{dicho}</span>}
                    {falta && <span className="rl-sr"> (falta resolver algo)</span>}
                  </span>
                )}
                {falta && <span className="rl-stepper_dot" aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ol>
      {compact && (
        <span className="rl-stepper_now" aria-hidden="true">
          {STEPS[i].label}
          {i < BUILD_STEPS && <span className="rl-stepper_count"> · {i + 1} de {BUILD_STEPS}</span>}
        </span>
      )}
    </nav>
  );
}
