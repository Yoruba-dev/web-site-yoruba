import { PLACEABLES, PLACEABLE_GROUPS } from "@/lib/symbols";
import PlaceableGlyph from "./PlaceableGlyph";

export type TowerMode = "both" | "left" | "right";

const TOWER_MODES: { id: TowerMode; label: string }[] = [
  { id: "both", label: "Ambas" },
  { id: "left", label: "Izquierda" },
  { id: "right", label: "Derecha" },
];

// Grouped tray of everything placeable (Odù towers + motifs). Each item is
// draggable and tappable. A signo has two towers (columnas) and is read left→
// right; the "torres" selector chooses whether tapping/dragging an Odù places the
// FULL sign (both towers) or a single tower — and the palette previews that choice.
export default function SymbolPalette({
  onPick,
  towerMode = "both",
  onTowerMode,
}: {
  onPick: (ref: string) => void;
  towerMode?: TowerMode;
  onTowerMode?: (m: TowerMode) => void;
}) {
  return (
    <div className="pyj-palette2">
      {PLACEABLE_GROUPS.map((group) => (
        <section key={group} className="pyj-palette2_group">
          <h3 className="pyj-palette2_gtitle">{group}</h3>

          {group === "Torres de Ifá" && onTowerMode && (
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
        </section>
      ))}
    </div>
  );
}
