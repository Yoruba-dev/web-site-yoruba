"use client";

import { useMemo, type MouseEvent } from "react";
import WatchFront from "@/components/watch/WatchFront";
import { BeadRow } from "./Swatches";
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

// ---------------------------------------------------------------------------
// Entrada del creador: "Empieza con tu Orisha". Ifá primero (la pieza
// estrella, con el reloj de verdad en vivo: no hay render de Ifá), luego los
// seis Orishas con su render ilustrativo y al final "Diseñar desde cero".
// Cada ficha es un enlace ?preset=… (funciona sin JavaScript y se puede
// compartir); con JavaScript se abre el editor sin recargar.
// ---------------------------------------------------------------------------

const RENDER = "/assets/images/reloj/presets";

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

export default function WatchEntry({
  onPick,
  onContinue,
  draftCode,
}: {
  onPick: (id: PresetId) => void;
  /** Hay un diseño guardado en este navegador. */
  onContinue?: () => void;
  draftCode?: string;
}) {
  const ifaConfig = useMemo(() => resolvePreset("ifa"), []);
  const orishas = PRESET_ORDER.filter((id): id is OrishaId => id !== "ifa" && id !== "cero");
  const go = (id: PresetId) => (e: MouseEvent<HTMLAnchorElement>) => {
    // Clic normal → editor sin recargar; con Ctrl/⌘ o rueda, el enlace de siempre.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onPick(id);
  };

  return (
    <section className="pyj-reloj_entry" aria-labelledby="pyj-reloj-entry-title">
      <header className="pyj-reloj_entryhead">
        <span className="pyj-eyebrow">✦ Creador de relojes ✦</span>
        <h2 id="pyj-reloj-entry-title" className="pyj-reloj_h2">
          Empieza con tu Orisha
        </h2>
        <p className="pyj-reloj_lead">Elige los colores de tu Orisha; después lo cambias todo.</p>
      </header>

      {onContinue && (
        <button type="button" className="pyj-reloj_continue" onClick={onContinue}>
          <span>Continuar mi diseño{draftCode ? ` · ${draftCode}` : ""}</span>
          <span aria-hidden="true">→</span>
        </button>
      )}

      <a href="?preset=ifa" className="pyj-reloj_ifa" onClick={go("ifa")}>
        <span className="pyj-reloj_ifawatch">
          <WatchFront config={ifaConfig} className="pyj-reloj_watch" />
        </span>
        <span className="pyj-reloj_ifatext">
          <span className="pyj-reloj_badge">✦ Pieza estrella</span>
          <span className="pyj-reloj_ifatitle">Ifá</span>
          <span className="pyj-reloj_ifanote">{WATCH_IFA_NOTE}</span>
          <BeadRow orisha="orula" count={12} />
          <span className="pyj-reloj_cardcta">Empezar con Ifá →</span>
          <span className="pyj-reloj_micro">Vista previa en vivo</span>
        </span>
      </a>

      <ul className="pyj-reloj_cards">
        {orishas.map((id, i) => {
          const p = ORISHA_WATCH_PRESETS[id];
          const note = fallbackNote(id);
          return (
            <li key={id}>
              <a href={`?preset=${id}`} className="pyj-reloj_card" onClick={go(id)}>
                <picture className="pyj-reloj_cardimg">
                  <source
                    type="image/avif"
                    srcSet={`${RENDER}/${id}-480.avif 480w, ${RENDER}/${id}-720.avif 720w`}
                    sizes="(min-width: 1024px) 240px, 46vw"
                  />
                  <source
                    type="image/webp"
                    srcSet={`${RENDER}/${id}-480.webp 480w, ${RENDER}/${id}-720.webp 720w`}
                    sizes="(min-width: 1024px) 240px, 46vw"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${RENDER}/${id}-480.webp`}
                    alt={`Reloj en los colores de ${p.label}`}
                    width={480}
                    height={480}
                    loading={i < 2 ? "eager" : "lazy"}
                    decoding="async"
                  />
                  <span className="pyj-reloj_micro pyj-reloj_micro--img">Render ilustrativo</span>
                </picture>
                <span className="pyj-reloj_cardbody">
                  <span className="pyj-reloj_cardtitle">{p.label}</span>
                  {p.orisha && <BeadRow orisha={p.orisha} />}
                  {note && <span className="pyj-reloj_cardnote">{note}</span>}
                </span>
              </a>
            </li>
          );
        })}
        <li>
          <a href="?preset=cero" className="pyj-reloj_card pyj-reloj_card--cero" onClick={go("cero")}>
            <span className="pyj-reloj_cerosign" aria-hidden="true">
              <svg viewBox="0 0 64 64" width="64" height="64" focusable="false">
                <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M32 18v28M18 32h28" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </span>
            <span className="pyj-reloj_cardbody">
              <span className="pyj-reloj_cardtitle">Diseñar desde cero</span>
              <span className="pyj-reloj_cardnote">Esfera blanca, rayas lisas y tú decides el resto.</span>
            </span>
          </a>
        </li>
      </ul>
    </section>
  );
}
