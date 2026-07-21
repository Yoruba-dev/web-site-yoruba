import { PLACEABLES, PLACEABLE_GROUPS } from "@/lib/symbols";
import PlaceableGlyph from "./PlaceableGlyph";

// Grouped tray of everything placeable (Odù towers + motifs). Each item is
// draggable (drop onto the active face) and tappable (adds to the middle of the
// active face, then drag to position) — mouse, touch and keyboard all covered.
export default function SymbolPalette({ onPick }: { onPick: (ref: string) => void }) {
  return (
    <div className="pyj-palette2">
      {PLACEABLE_GROUPS.map((group) => (
        <section key={group} className="pyj-palette2_group">
          <h3 className="pyj-palette2_gtitle">{group}</h3>
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
                  <PlaceableGlyph placeable={p} className="pyj-palette2_glyph" />
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
