"use client";

import { useRef, useState } from "react";
import type { RingSlotId } from "@/lib/odu";
import {
  getPlaceable,
  ITEM_DEFAULTS,
  ITEM_MIN_SCALE,
  ITEM_MAX_SCALE,
  type PlacedItem,
} from "@/lib/symbols";
import { ORISHAS, getOrishaGems } from "@/lib/orisha-colors";
import FaceCanvas from "./FaceCanvas";
import SymbolPalette, { type TowerMode } from "./SymbolPalette";
import ConfiguratorOrderPanel, {
  type RingDesign,
  type ConfiguratorProduct,
} from "./ConfiguratorOrderPanel";

// The wizard walks the three ring faces in the order the piece is engraved.
const STEPS: {
  id: RingSlotId;
  label: string;
  short: string;
  shape: "round" | "shoulder";
}[] = [
  { id: "front", label: "Frente", short: "Frente", shape: "round" },
  { id: "right", label: "Lateral derecho", short: "Derecho", shape: "shoulder" },
  { id: "left", label: "Lateral izquierdo", short: "Izquierdo", shape: "shoulder" },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Fixed size for an Odù engraved on the FRONT — it fills the central red field.
const FRONT_ITEM_SCALE = 2.3;

function StepIcon({ done }: { done: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" focusable="false">
      {done ? (
        <path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <circle cx="12" cy="12" r="4" fill="currentColor" />
      )}
    </svg>
  );
}

export default function RingConfigurator({
  product,
}: {
  product?: ConfiguratorProduct;
}) {
  const [design, setDesign] = useState<RingDesign>({ front: [], right: [], left: [] });
  const [stepIdx, setStepIdx] = useState(0);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [towerMode, setTowerMode] = useState<TowerMode>("both");
  const [orisha, setOrisha] = useState("");
  const uid = useRef(0);

  const gems = getOrishaGems(orisha);
  const step = STEPS[stepIdx];
  const face = step.id;
  const items = design[face];

  const patch = (id: RingSlotId, next: PlacedItem[]) =>
    setDesign((d) => ({ ...d, [id]: next }));

  function addItem(ref: string, x: number, y: number) {
    const p = getPlaceable(ref);
    if (!p) return;
    const id = `it${++uid.current}`;
    // A tower's SIDE follows the tower choice so it reads left→right: left tower to
    // the left, right tower to the right, both centered. On the FRONT it's engraved
    // large & centered; on the SIDE it snaps into the gate. Motifs stay free on the
    // sides.
    const front = step.shape === "round";
    const isTower = p.kind === "tower";
    const off = 0.08; // side spread — towers sit close, forming the two-column sign
    const sideX =
      towerMode === "left" ? 0.5 - off : towerMode === "right" ? 0.5 + off : 0.5;
    patch(face, [
      ...design[face],
      {
        uid: id,
        ref,
        x: front ? (isTower ? sideX : 0.5) : isTower ? sideX : x,
        y: front ? 0.5 : isTower ? 0.37 : y,
        scale: front ? FRONT_ITEM_SCALE : ITEM_DEFAULTS.scale,
        rotation: ITEM_DEFAULTS.rotation,
        tower: p.kind === "tower" ? towerMode : undefined,
      },
    ]);
    setSelectedUid(id);
  }
  function flipTower(u: string) {
    const next: Record<"both" | "left" | "right", "both" | "left" | "right"> = {
      both: "left",
      left: "right",
      right: "both",
    };
    mapFace((it) =>
      it.uid === u ? { ...it, tower: next[it.tower ?? "both"] } : it,
    );
  }
  const mapFace = (fn: (it: PlacedItem) => PlacedItem) =>
    patch(face, design[face].map(fn));

  function moveItem(u: string, x: number, y: number) {
    mapFace((it) => (it.uid === u ? { ...it, x, y } : it));
  }
  function scaleItem(u: string, delta: number) {
    mapFace((it) =>
      it.uid === u ? { ...it, scale: clamp(it.scale + delta, ITEM_MIN_SCALE, ITEM_MAX_SCALE) } : it,
    );
  }
  function rotateItem(u: string, delta: number) {
    mapFace((it) => (it.uid === u ? { ...it, rotation: (it.rotation + delta) % 360 } : it));
  }
  function removeItem(u: string) {
    patch(face, design[face].filter((it) => it.uid !== u));
    setSelectedUid(null);
  }

  function goTo(idx: number) {
    setStepIdx(clamp(idx, 0, STEPS.length - 1));
    setSelectedUid(null);
  }

  return (
    <div className="pyj-cfg2">
      {/* Step tabs / progress */}
      <ol className="pyj-steps" aria-label="Pasos del diseño">
        {STEPS.map((s, i) => {
          const state = i === stepIdx ? "is-active" : i < stepIdx ? "is-done" : "";
          const count = design[s.id].length;
          return (
            <li key={s.id} className={`pyj-step ${state}`}>
              <button
                type="button"
                className="pyj-step_btn"
                aria-current={i === stepIdx ? "step" : undefined}
                onClick={() => goTo(i)}
              >
                <span className="pyj-step_mark">
                  <StepIcon done={i < stepIdx} />
                </span>
                <span className="pyj-step_label">{s.short}</span>
                {count > 0 && <span className="pyj-step_count">{count}</span>}
              </button>
            </li>
          );
        })}
      </ol>

      {/* Gems by the wearer's Orisha (santo / ángel de la guarda) */}
      <div className="pyj-orisha">
        <label className="pyj-orisha_label" htmlFor="pyj-orisha-sel">
          Gemas según tu santo / ángel de la guarda
        </label>
        <div className="pyj-orisha_row">
          <select
            id="pyj-orisha-sel"
            className="pyj-orisha_sel"
            value={orisha}
            onChange={(e) => setOrisha(e.target.value)}
          >
            <option value="">Sin gemas de santo (predeterminado)</option>
            {ORISHAS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} · {o.saint}
              </option>
            ))}
          </select>
          {gems && (
            <span className="pyj-orisha_swatches" aria-hidden="true">
              {gems.map((c, i) => (
                <span key={i} style={{ background: c }} />
              ))}
            </span>
          )}
        </div>
      </div>

      <div className="pyj-cfg2_main">
        <div className="pyj-cfg2_stage">
          <FaceCanvas
            shape={step.shape}
            items={items}
            selectedUid={selectedUid}
            gems={gems}
            onAdd={addItem}
            onMove={moveItem}
            onSelect={setSelectedUid}
            onRemove={removeItem}
            onScale={scaleItem}
            onRotate={rotateItem}
            onFlipTower={flipTower}
          />

          <div className="pyj-cfg2_nav">
            <button
              type="button"
              className="pyj-cfg2_navbtn"
              onClick={() => goTo(stepIdx - 1)}
              disabled={stepIdx === 0}
            >
              ← Anterior
            </button>
            <span className="pyj-cfg2_navlabel">
              {step.label} · paso {stepIdx + 1} de {STEPS.length}
            </span>
            <button
              type="button"
              className="pyj-cfg2_navbtn pyj-cfg2_navbtn--next"
              onClick={() => goTo(stepIdx + 1)}
              disabled={stepIdx === STEPS.length - 1}
            >
              Siguiente →
            </button>
          </div>
        </div>

        <div className="pyj-cfg2_side">
          <div className="pyj-cfg2_palette">
            <h2 className="pyj-cfg_palette-title">Arrastra tus símbolos</h2>
            <SymbolPalette
              onPick={(ref) => addItem(ref, 0.5, step.shape === "shoulder" ? 0.37 : 0.5)}
              towerMode={towerMode}
              onTowerMode={setTowerMode}
            />
          </div>

          <div className="pyj-cfg2_order">
            <ConfiguratorOrderPanel
              design={design}
              product={product}
              orisha={orisha}
              onReset={() => {
                setDesign({ front: [], right: [], left: [] });
                setSelectedUid(null);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
