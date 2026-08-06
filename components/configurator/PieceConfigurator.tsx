"use client";

import { useRef, useState } from "react";
import type { ConfigurablePiece, PieceFace } from "@/lib/pieces";
import {
  getPlaceable,
  ITEM_DEFAULTS,
  type Placeable,
  type PlacedItem,
} from "@/lib/symbols";
import { ORISHAS, getOrishaGems } from "@/lib/orisha-colors";
import FaceCanvas from "./FaceCanvas";
import SymbolPalette, { type TowerMode } from "./SymbolPalette";
import ConfiguratorOrderPanel, {
  type RingDesign,
  type ConfiguratorProduct,
} from "./ConfiguratorOrderPanel";

// EL editor. Uno solo para todas las piezas: lee la pieza de lib/pieces.ts y
// se dibuja sola. Antes había un componente por pieza y lo que se mejoraba en
// uno no llegaba al otro — así se perdió el selector de torres en la moneda.
// Si algo aquí sirve solo a una pieza, es señal de que ese dato pertenece a
// lib/pieces.ts, no a este archivo.

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Separación de las dos torres cuando encajan: quedan juntas, formando el signo. */
const TOWER_OFFSET = 0.08;

/** Dónde cae un símbolo según la cara, respetando el encaje de cada una. */
function landing(
  face: PieceFace,
  p: Placeable,
  towerMode: TowerMode,
  x: number,
  y: number,
): { x: number; y: number } {
  const isTower = p.kind === "tower";
  // Una torre se lee de izquierda a derecha: la izquierda a la izquierda, la
  // derecha a la derecha, ambas centradas.
  const sideX =
    towerMode === "left"
      ? 0.5 - TOWER_OFFSET
      : towerMode === "right"
        ? 0.5 + TOWER_OFFSET
        : 0.5;
  if (face.placement === "centro") return { x: isTower ? sideX : 0.5, y: 0.5 };
  if (face.placement === "puerta") return isTower ? { x: sideX, y: 0.37 } : { x, y };
  // Campo libre: cae donde se suelte, pero una torre con lado se aparta igual
  // que en el anillo. Sin esto, la izquierda y la derecha se colocan una encima
  // de la otra en vez de componer el signo.
  return isTower ? { x: clamp(x + (sideX - 0.5), 0, 1), y } : { x, y };
}

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

export default function PieceConfigurator({
  piece,
  product,
}: {
  piece: ConfigurablePiece;
  product?: ConfiguratorProduct;
}) {
  const [design, setDesign] = useState<RingDesign>(() =>
    Object.fromEntries(piece.faces.map((f) => [f.id, []])),
  );
  const [stepIdx, setStepIdx] = useState(0);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [towerMode, setTowerMode] = useState<TowerMode>("both");
  const [orisha, setOrisha] = useState("");
  const uid = useRef(0);

  const gems = piece.orishaGems ? getOrishaGems(orisha) : undefined;
  const face = piece.faces[stepIdx];
  const items = design[face.id] ?? [];
  // Una pieza de una sola cara no necesita pasos ni anterior/siguiente.
  const multiFace = piece.faces.length > 1;

  const patch = (id: string, next: PlacedItem[]) =>
    setDesign((d) => ({ ...d, [id]: next }));
  const mapFace = (fn: (it: PlacedItem) => PlacedItem) =>
    patch(face.id, items.map(fn));

  function addItem(ref: string, x: number, y: number) {
    const p = getPlaceable(ref);
    if (!p) return;
    const id = `it${++uid.current}`;
    const at = landing(face, p, towerMode, x, y);
    patch(face.id, [
      ...items,
      {
        uid: id,
        ref,
        x: at.x,
        y: at.y,
        scale: face.itemScale * ITEM_DEFAULTS.scale,
        rotation: ITEM_DEFAULTS.rotation,
        tower: p.kind === "tower" ? towerMode : undefined,
      },
    ]);
    setSelectedUid(id);
  }

  function flipTower(u: string) {
    const next: Record<TowerMode, TowerMode> = {
      both: "left",
      left: "right",
      right: "both",
    };
    mapFace((it) => (it.uid === u ? { ...it, tower: next[it.tower ?? "both"] } : it));
  }
  function moveItem(u: string, x: number, y: number) {
    mapFace((it) => (it.uid === u ? { ...it, x, y } : it));
  }
  function scaleItem(u: string, delta: number) {
    mapFace((it) =>
      it.uid === u
        ? { ...it, scale: clamp(it.scale + delta, piece.minScale, piece.maxScale) }
        : it,
    );
  }
  function rotateItem(u: string, delta: number) {
    mapFace((it) => (it.uid === u ? { ...it, rotation: (it.rotation + delta) % 360 } : it));
  }
  function removeItem(u: string) {
    patch(face.id, items.filter((it) => it.uid !== u));
    setSelectedUid(null);
  }

  function goTo(idx: number) {
    setStepIdx(clamp(idx, 0, piece.faces.length - 1));
    setSelectedUid(null);
  }

  return (
    <div className={`pyj-cfg2${piece.selectionOutline ? "" : " pyj-cfg2--sin-marco"}`}>
      {multiFace && (
        <ol className="pyj-steps" aria-label={piece.stepsLabel}>
          {piece.faces.map((f, i) => {
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
      )}

      {/* Gemas según el santo / ángel de la guarda de quien la lleva. Solo en
          las piezas que llevan piedras engastadas — en la moneda no aplica. */}
      {piece.orishaGems && (
        <div className="pyj-orisha">
          <label className="pyj-orisha_label" htmlFor={`pyj-orisha-${piece.id}`}>
            Gemas según tu santo / ángel de la guarda
          </label>
          <div className="pyj-orisha_row">
            <select
              id={`pyj-orisha-${piece.id}`}
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
      )}

      <div className="pyj-cfg2_main">
        <div className="pyj-cfg2_stage">
          {face.hint && <p className="pyj-coin_hint">{face.hint}</p>}

          <FaceCanvas
            shape={face.shape}
            coinFace={face.coin}
            items={items}
            selectedUid={selectedUid}
            gems={gems}
            emptyHint={face.emptyHint}
            onAdd={addItem}
            onMove={moveItem}
            onSelect={setSelectedUid}
            onRemove={removeItem}
            onScale={scaleItem}
            onRotate={rotateItem}
            onFlipTower={flipTower}
          />

          {multiFace && (
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
                {face.short} · paso {stepIdx + 1} de {piece.faces.length}
              </span>
              <button
                type="button"
                className="pyj-cfg2_navbtn pyj-cfg2_navbtn--next"
                onClick={() => goTo(stepIdx + 1)}
                disabled={stepIdx === piece.faces.length - 1}
              >
                Siguiente →
              </button>
            </div>
          )}

          {piece.specs && <p className="pyj-coin_specs">{piece.specs}</p>}
        </div>

        <div className="pyj-cfg2_side">
          <div className="pyj-cfg2_palette">
            <h2 className="pyj-cfg_palette-title">{piece.paletteTitle}</h2>
            <SymbolPalette
              onPick={(ref) => onPickCenter(ref)}
              towerMode={towerMode}
              onTowerMode={setTowerMode}
              piece={piece.id}
              groups={piece.groups}
            />
          </div>

          <div className="pyj-cfg2_order">
            <ConfiguratorOrderPanel
              design={design}
              product={product}
              orisha={orisha}
              piece={piece.id}
              faceOrder={piece.faces.map((f) => ({ id: f.id, label: f.label }))}
              onReset={() => {
                setDesign(Object.fromEntries(piece.faces.map((f) => [f.id, []])));
                setSelectedUid(null);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Tocar (en vez de arrastrar) suelta el símbolo en el medio de la cara; el
  // encaje de `landing` decide el resto.
  function onPickCenter(ref: string) {
    addItem(ref, 0.5, face.placement === "puerta" ? 0.37 : 0.5);
  }
}
