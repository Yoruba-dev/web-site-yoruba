"use client";

import { useState } from "react";
import { PLACEABLES, PLACEABLE_GROUPS, type Placeable } from "@/lib/symbols";
import PlaceableGlyph from "./PlaceableGlyph";

export type TowerMode = "both" | "left" | "right";

const TOWER_MODES: { id: TowerMode; label: string }[] = [
  { id: "both", label: "Ambas" },
  { id: "left", label: "Izquierda" },
  { id: "right", label: "Derecha" },
];

// Grouped tray of everything placeable (Odù towers + motifs). To keep the page
// short and app-like, the groups are TABS — only one shows at a time. Each item is
// draggable and tappable. A signo has two towers (columnas) read left→right; the
// "torres" selector (Torres tab only) chooses whether tapping/dragging an Odù places
// the FULL sign (both towers) or a single tower — and the palette previews that.
export default function SymbolPalette({
  onPick,
  towerMode = "both",
  onTowerMode,
}: {
  onPick: (ref: string) => void;
  towerMode?: TowerMode;
  onTowerMode?: (m: TowerMode) => void;
}) {
  const [group, setGroup] = useState<Placeable["group"]>(PLACEABLE_GROUPS[0]);
  const isTowers = group === "Torres de Ifá";

  return (
    <div className="pyj-palette2">
      <div className="pyj-palette2_tabs" role="tablist" aria-label="Categorías de símbolos">
        {PLACEABLE_GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            role="tab"
            aria-selected={g === group}
            className={`pyj-palette2_tab${g === group ? " is-on" : ""}`}
            onClick={() => setGroup(g)}
          >
            {g}
          </button>
        ))}
      </div>

      <p className="pyj-palette2_hint">
        {isTowers
          ? "Tus signos de Ifá — la base del diseño."
          : "Opcionales — un detalle extra para tu anillo."}
      </p>

      {isTowers && onTowerMode && (
        <div className="pyj-towermode" role="radiogroup" aria-label="Qué torre colocar">
          {TOWER_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={towerMode === m.id}
              className={`pyj-towermode_btn${towerMode === m.id ? " is-on" : ""}`}
              onClick={() => onTowerMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      <ul className="pyj-palette2_grid">
        {PLACEABLES.filter((p) => p.group === group).map((p) => (
          <li key={p.id} className="pyj-palette2_cell">
            <button
              type="button"
              className="pyj-palette2_item"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", p.id);
                e.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => onPick(p.id)}
              aria-label={`${p.name}. Arrástralo al anillo o tócalo para agregarlo`}
              title={p.name}
            >
              <PlaceableGlyph
                placeable={p}
                tower={p.kind === "tower" ? towerMode : "both"}
                className="pyj-palette2_glyph"
              />
              <span className="pyj-palette2_name">{p.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
