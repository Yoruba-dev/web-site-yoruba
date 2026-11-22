"use client";

// ---------------------------------------------------------------------------
// La barra de pasos (spec V2 §3.3 / §6.1): UNA fila de 5 segmentos iguales,
// barra de 4 px + etiqueta de 11 px. Hecho = oro; actual = oro que se llena;
// por hacer = cristal; un punto rojo de 6 px = algo que resolver en ese paso.
// Todos se pueden pulsar, en cualquier orden. En la hoja del móvil las barras
// van solas y la etiqueta dice "Correa · 3 de 4".
// ---------------------------------------------------------------------------
import { BUILD_STEPS, STEPS, stepIndex, type StepId } from "../creator-state";

export default function Stepper({
  step,
  max,
  blocked,
  onGo,
  compact = false,
}: {
  step: StepId;
  /** Paso más alto alcanzado. */
  max: number;
  /** Pasos con algo que resolver (punto rojo). */
  blocked: ReadonlySet<StepId>;
  onGo: (s: StepId) => void;
  /** Hoja del móvil: barras + "Paso · n de 4". */
  compact?: boolean;
}) {
  const i = stepIndex(step);
  return (
    <nav className={`rl-stepper${compact ? " rl-stepper--compact" : ""}`} aria-label="Pasos del diseño">
      <ol>
        {STEPS.map((s, k) => {
          const state = k === i ? "now" : k <= max ? "done" : "todo";
          const falta = blocked.has(s.id);
          return (
            <li key={s.id}>
              <button
                type="button"
                className={`rl-stepper_btn is-${state}`}
                aria-current={k === i ? "step" : undefined}
                aria-label={compact ? `${s.label}${falta ? " (falta resolver algo)" : ""}` : undefined}
                onClick={() => onGo(s.id)}
              >
                <span className="rl-stepper_bar" aria-hidden="true">
                  <span className="rl-stepper_fill" />
                </span>
                {!compact && (
                  <span className="rl-stepper_label">
                    {s.label}
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
