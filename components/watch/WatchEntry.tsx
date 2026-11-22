"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, type MouseEvent, type PointerEvent as RPointerEvent } from "react";
import { BeadRow, LayerThumb } from "./Swatches";
import { layerUrl } from "./creator-state";
import { GUIA_HREF } from "./shell/FocusHeader";
import { Icon } from "./shell/icons";
import {
  ORISHA_WATCH_PRESETS,
  PRESET_ORDER,
  WATCH_IFA_NOTE,
  getSecondsPart,
  getStrap,
  resolvePreset,
  type OrishaId,
  type PresetId,
} from "@/lib/watch";
import { nombresCapas } from "@/lib/watch-capas";

// ---------------------------------------------------------------------------
// Entrada del creador (spec V2 §3.8): "Empieza con tu Orisha", en el mismo
// armazón sin desplazamiento. Ifá primero (la pieza estrella, a dos
// columnas), los seis Orishas con un recorte de la CABEZA real (caja + esfera,
// las mismas capas que arma el escenario: lo que ves es lo que se arma) y sus
// cuentas, "Desde cero" y el enlace a "Cómo funciona". Cada ficha es un enlace
// ?preset=… (funciona sin JavaScript y se puede compartir); con JavaScript
// abre el editor sin recargar. Al pasar por una ficha (escritorio), el
// escenario enseña ese reloj entero.
// ---------------------------------------------------------------------------

/** "Caucho blanco mientras llega el caucho amarillo" cuando el preset tuvo que
 *  usar su segunda opción porque la primera aún no está en el taller. */
function fallbackNote(id: PresetId): string | null {
  const p = ORISHA_WATCH_PRESETS[id];
  const c = resolvePreset(id);
  const notes: string[] = [];
  const wantStrap = p.prefer.correa[0];
  if (wantStrap && wantStrap !== c.correa) {
    const got = getStrap(c.correa)?.label;
    const want = getStrap(wantStrap)?.label.toLowerCase();
    if (got && want) notes.push(`${got} mientras llega el ${want}`);
  }
  const wantSec = p.prefer.segundero[0];
  if (wantSec && wantSec !== c.segundero) {
    const got = getSecondsPart(c.segundero)?.label.toLowerCase();
    const want = getSecondsPart(wantSec)?.label.toLowerCase();
    if (got && want) notes.push(`segundero ${got} mientras llega el ${want}`);
  }
  if (!notes.length) return null;
  const s = notes.join(" · ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** El recorte de la cabeza del reloj de un preset (caja + esfera reales). */
function Cabeza({ id }: { id: PresetId }) {
  const c = resolvePreset(id);
  const n = nombresCapas(c);
  return <LayerThumb crop="cabeza" layers={[layerUrl(`caja-${c.acabado}`), layerUrl(n.esfera)]} />;
}

/** "hace 2 h", "hace 3 días": cuándo se tocó el borrador por última vez. */
function hace(at: number): string {
  const min = Math.round((Date.now() - at) / 60000);
  if (!at || min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return `hace ${d} ${d === 1 ? "día" : "días"}`;
}

export default function WatchEntry({
  onPick,
  onHover,
  onContinue,
  draft,
}: {
  onPick: (id: PresetId) => void;
  /** Escritorio: la ficha bajo el cursor / con el foco (null al salir). */
  onHover?: (id: PresetId | null) => void;
  /** Hay un diseño guardado en este navegador. */
  onContinue?: () => void;
  draft?: { code: string; at: number } | null;
}) {
  const orishas = useMemo(() => PRESET_ORDER.filter((id): id is OrishaId => id !== "ifa" && id !== "cero"), []);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const go = (id: PresetId) => (e: MouseEvent<HTMLAnchorElement>) => {
    // Clic normal → editor sin recargar; con Ctrl/⌘ o rueda, el enlace de siempre.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    window.clearTimeout(timer.current);
    onPick(id);
  };
  // Pasar por una ficha: 120 ms de espera, así cruzar la rejilla no hace parpadear el reloj.
  const hover = (id: PresetId | null) => {
    if (!onHover) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onHover(id), 120);
  };
  const props = (id: PresetId) => ({
    href: `?preset=${id}`,
    onClick: go(id),
    onPointerEnter: (e: RPointerEvent) => e.pointerType === "mouse" && hover(id),
    onFocus: () => hover(id),
  });

  return (
    <div
      className="rl-entry"
      onPointerLeave={(e) => e.pointerType === "mouse" && hover(null)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hover(null);
      }}
    >
      {onContinue && draft && (
        <button type="button" className="rl-entry_draft" onClick={onContinue}>
          <span className="rl-entry_drafttxt">
            <span className="rl-entry_draftk">Continuar mi diseño</span>
            <span className="rl-entry_draftv">
              {draft.code} · {hace(draft.at)}
            </span>
          </span>
          <Icon name="next" />
        </button>
      )}

      <ul className="rl-entry_grid" aria-label="Empieza con tu Orisha">
        <li className="rl-entry_ifa">
          <a className="rl-card rl-card--ifa" {...props("ifa")}>
            <span className="rl-card_thumb" aria-hidden="true">
              <Cabeza id="ifa" />
            </span>
            <span className="rl-card_body">
              <span className="rl-card_badge">✦ Pieza estrella</span>
              <span className="rl-card_title">Ifá</span>
              <span className="rl-card_note">{WATCH_IFA_NOTE}</span>
            </span>
          </a>
        </li>
        {orishas.map((id) => {
          const p = ORISHA_WATCH_PRESETS[id];
          const note = fallbackNote(id);
          return (
            <li key={id}>
              <a className="rl-card" {...props(id)} title={note ?? undefined}>
                <span className="rl-card_thumb" aria-hidden="true">
                  <Cabeza id={id} />
                </span>
                <span className="rl-card_body">
                  <span className="rl-card_title">{p.label}</span>
                  {p.orisha && <BeadRow orisha={p.orisha} count={7} />}
                </span>
              </a>
            </li>
          );
        })}
        <li className="rl-entry_cero">
          <a className="rl-card rl-card--cero" {...props("cero")}>
            <span className="rl-card_plus" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="24" height="24" focusable="false">
                <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </span>
            <span className="rl-card_body">
              <span className="rl-card_title">Desde cero</span>
              <span className="rl-card_note">Esfera blanca y rayas lisas</span>
            </span>
          </a>
        </li>
      </ul>

      <Link href={GUIA_HREF} className="rl-entry_guide">
        ¿Cómo funciona? Precio, plazo y prueba <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
