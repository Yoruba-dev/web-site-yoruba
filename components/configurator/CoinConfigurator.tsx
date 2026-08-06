"use client";

import { useRef, useState } from "react";
import { COIN_FACES, COIN_SPECS, type CoinFaceId } from "@/lib/coin";
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

// The coin editor. Same machinery as the ring (FaceCanvas + SymbolPalette +
// ConfiguratorOrderPanel), but the canvas sits on a PHOTO of the real 36.5 mm
// piece and there are two faces instead of three.
//
// One real difference from the ring: a coin is STRUCK, and the anverso already
// carries all 16 Odù Meji around its rim. What the customer chooses is the sign
// engraved in the central field — so the palette is locked to whole Odù
// ("ambas torres"), never a half sign, which on a coin would read as a mistake.

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// A sign engraved in the anverso's small central field fills it; the reverso is
// a wider open field, so a symbol starts at its natural size there.
const FIELD_SCALE: Record<CoinFaceId, number> = { anverso: 1.5, reverso: 1.2 };

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

export default function CoinConfigurator({
  product,
}: {
  product?: ConfiguratorProduct;
}) {
  const [design, setDesign] = useState<RingDesign>({ anverso: [], reverso: [] });
  const [stepIdx, setStepIdx] = useState(0);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [orisha, setOrisha] = useState("");
  const uid = useRef(0);

  const gems = getOrishaGems(orisha);
  const face = COIN_FACES[stepIdx];
  const items = design[face.id] ?? [];

  const patch = (id: string, next: PlacedItem[]) =>
    setDesign((d) => ({ ...d, [id]: next }));
  const mapFace = (fn: (it: PlacedItem) => PlacedItem) =>
    patch(face.id, (design[face.id] ?? []).map(fn));

  function addItem(ref: string, x: number, y: number) {
    const p = getPlaceable(ref);
    if (!p) return;
    const id = `it${++uid.current}`;
    patch(face.id, [
      ...(design[face.id] ?? []),
      {
        uid: id,
        ref,
        x,
        y,
        scale: FIELD_SCALE[face.id] * ITEM_DEFAULTS.scale,
        rotation: ITEM_DEFAULTS.rotation,
        // Always the WHOLE Odù on a coin — see the note at the top.
        tower: p.kind === "tower" ? "both" : undefined,
      },
    ]);
    setSelectedUid(id);
  }

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
    patch(face.id, (design[face.id] ?? []).filter((it) => it.uid !== u));
    setSelectedUid(null);
  }

  function goTo(idx: number) {
    setStepIdx(clamp(idx, 0, COIN_FACES.length - 1));
    setSelectedUid(null);
  }

  return (
    <div className="pyj-cfg2">
      <ol className="pyj-steps" aria-label="Caras de la moneda">
        {COIN_FACES.map((f, i) => {
          const state = i === stepIdx ? "is-active" : i < stepIdx ? "is-done" : "";
          const count = (design[f.id] ?? []).length;
          return (
            <li key={f.id} className={`pyj-step ${state}`}>
              <button
                type="button"
                className="pyj-step_btn"
                aria-current={i === stepIdx ? "step" : undefined}
                onClick={() => goTo(i)}
              >
                <span className="pyj-step_mark">
                  <StepIcon done={i < stepIdx} />
                </span>
                <span className="pyj-step_label">{f.short}</span>
                {count > 0 && <span className="pyj-step_count">{count}</span>}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="pyj-orisha">
        <label className="pyj-orisha_label" htmlFor="pyj-orisha-moneda">
          Gemas según tu santo / ángel de la guarda
        </label>
        <div className="pyj-orisha_row">
          <select
            id="pyj-orisha-moneda"
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
          <p className="pyj-coin_hint">{face.hint}</p>

          <FaceCanvas
            shape="coin"
            coinFace={face}
            items={items}
            selectedUid={selectedUid}
            gems={gems}
            emptyHint={
              face.id === "anverso"
                ? "Coloca aquí tu signo"
                : "Coloca aquí un signo o un símbolo"
            }
            onAdd={addItem}
            onMove={moveItem}
            onSelect={setSelectedUid}
            onRemove={removeItem}
            onScale={scaleItem}
            onRotate={rotateItem}
            onFlipTower={() => {}}
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
            {/* `short`, not `label`: "Anverso · tu signo · paso 1 de 2" wraps to
                three lines on a phone and squeezes the Siguiente button. */}
            <span className="pyj-cfg2_navlabel">
              {face.short} · paso {stepIdx + 1} de {COIN_FACES.length}
            </span>
            <button
              type="button"
              className="pyj-cfg2_navbtn pyj-cfg2_navbtn--next"
              onClick={() => goTo(stepIdx + 1)}
              disabled={stepIdx === COIN_FACES.length - 1}
            >
              Siguiente →
            </button>
          </div>

          <p className="pyj-coin_specs">
            Moneda real: {COIN_SPECS.metal} · {COIN_SPECS.diameterMm} mm de
            diámetro · {COIN_SPECS.thicknessMm} mm de grosor
          </p>
        </div>

        <div className="pyj-cfg2_side">
          <div className="pyj-cfg2_palette">
            <h2 className="pyj-cfg_palette-title">Elige tu signo</h2>
            {/* No `onTowerMode`: on a struck coin the sign is always whole. */}
            <SymbolPalette
              onPick={(ref) => addItem(ref, 0.5, 0.5)}
              towerMode="both"
              piece="moneda"
            />
          </div>

          <div className="pyj-cfg2_order">
            <ConfiguratorOrderPanel
              design={design}
              product={product}
              orisha={orisha}
              piece="moneda"
              faceOrder={COIN_FACES.map((f) => ({ id: f.id, label: f.label }))}
              onReset={() => {
                setDesign({ anverso: [], reverso: [] });
                setSelectedUid(null);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
