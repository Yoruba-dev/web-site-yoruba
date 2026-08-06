"use client";

import { useRef, useState } from "react";
import { COIN_FACES, COIN_SPECS } from "@/lib/coin";
import {
  getPlaceable,
  ITEM_DEFAULTS,
  ITEM_MIN_SCALE,
  ITEM_MAX_SCALE,
  type PlacedItem,
} from "@/lib/symbols";
import { ORISHAS, getOrishaGems } from "@/lib/orisha-colors";
import FaceCanvas from "./FaceCanvas";
import SymbolPalette from "./SymbolPalette";
import ConfiguratorOrderPanel, {
  type RingDesign,
  type ConfiguratorProduct,
} from "./ConfiguratorOrderPanel";

// The coin editor. Same machinery as the ring (FaceCanvas + SymbolPalette +
// ConfiguratorOrderPanel), but the canvas sits on a PHOTO of the real 36.5 mm
// piece — and there is only ONE face to design.
//
// Two real differences from the ring, both coming from the piece itself:
//   • A coin is STRUCK. The anverso already carries the 16 Odù Meji and "IFA",
//     so it is not editable at all — no stepper, no second canvas.
//   • The sign is always the WHOLE Odù. A half sign on a coin reads as a
//     mistake, so the palette is locked to "ambas torres".

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const FACE = COIN_FACES[0];
// The reverso is a wide open field, so a symbol starts a little above its
// natural size — it should read as an engraving, not as a speck.
const FIELD_SCALE = 1.2;

export default function CoinConfigurator({
  product,
}: {
  product?: ConfiguratorProduct;
}) {
  const [design, setDesign] = useState<RingDesign>({ [FACE.id]: [] });
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [orisha, setOrisha] = useState("");
  const uid = useRef(0);

  const gems = getOrishaGems(orisha);
  const items = design[FACE.id] ?? [];

  const patch = (next: PlacedItem[]) => setDesign({ [FACE.id]: next });
  const mapFace = (fn: (it: PlacedItem) => PlacedItem) => patch(items.map(fn));

  function addItem(ref: string, x: number, y: number) {
    const p = getPlaceable(ref);
    if (!p) return;
    const id = `it${++uid.current}`;
    patch([
      ...items,
      {
        uid: id,
        ref,
        x,
        y,
        scale: FIELD_SCALE * ITEM_DEFAULTS.scale,
        rotation: ITEM_DEFAULTS.rotation,
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
    patch(items.filter((it) => it.uid !== u));
    setSelectedUid(null);
  }

  return (
    <div className="pyj-cfg2">
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
          <p className="pyj-coin_hint">{FACE.hint}</p>

          <FaceCanvas
            shape="coin"
            coinFace={FACE}
            items={items}
            selectedUid={selectedUid}
            gems={gems}
            emptyHint="Coloca aquí tu signo"
            onAdd={addItem}
            onMove={moveItem}
            onSelect={setSelectedUid}
            onRemove={removeItem}
            onScale={scaleItem}
            onRotate={rotateItem}
            onFlipTower={() => {}}
          />

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
                patch([]);
                setSelectedUid(null);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
