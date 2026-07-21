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
import FaceCanvas from "./FaceCanvas";
import SymbolPalette from "./SymbolPalette";
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
  const uid = useRef(0);

  const step = STEPS[stepIdx];
  const face = step.id;
  const items = design[face];

  const patch = (id: RingSlotId, next: PlacedItem[]) =>
    setDesign((d) => ({ ...d, [id]: next }));

  function addItem(ref: string, x: number, y: number) {
    const p = getPlaceable(ref);
    if (!p) return;
    const id = `it${++uid.current}`;
    patch(face, [
      ...design[face],
      {
        uid: id,
        ref,
        x,
        y,
        scale: ITEM_DEFAULTS.scale,
        rotation: ITEM_DEFAULTS.rotation,
        tower: p.kind === "tower" ? "both" : undefined,
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

      <div className="pyj-cfg2_main">
        <div className="pyj-cfg2_stage">
          <FaceCanvas
            shape={step.shape}
            items={items}
            selectedUid={selectedUid}
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

        <div className="pyj-cfg2_palette">
          <h2 className="pyj-cfg_palette-title">Arrastra tus símbolos</h2>
          <SymbolPalette onPick={(ref) => addItem(ref, 0.5, 0.5)} />
        </div>
      </div>

      <div className="pyj-cfg2_order">
        <ConfiguratorOrderPanel
          design={design}
          product={product}
          onReset={() => {
            setDesign({ front: [], right: [], left: [] });
            setSelectedUid(null);
          }}
        />
      </div>
    </div>
  );
}
