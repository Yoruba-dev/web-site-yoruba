import { getOdu } from "@/lib/odu";
import { type Placeable } from "@/lib/symbols";
import OduGlyph from "./OduGlyph";
import MotifGlyph from "./MotifGlyph";

// Resolves any Placeable to its glyph — an Odù tower or a motif. One entry point
// so the palette, the canvas and the summary all render symbols the same way.
export default function PlaceableGlyph({
  placeable,
  tower = "both",
  className,
  decorative = true,
}: {
  placeable: Placeable;
  /** "both" = the full Odù (two towers, as in the chart); "left"/"right" = a single tower. */
  tower?: "both" | "left" | "right";
  className?: string;
  decorative?: boolean;
}) {
  if (placeable.kind === "tower" && placeable.oduId) {
    const odu = getOdu(placeable.oduId);
    if (!odu) return null;
    return (
      <OduGlyph
        odu={odu}
        tower={tower === "both" ? undefined : tower}
        className={className}
        decorative={decorative}
      />
    );
  }
  if (placeable.kind === "motif" && placeable.motif) {
    return (
      <MotifGlyph
        motif={placeable.motif}
        name={placeable.name}
        className={className}
        decorative={decorative}
      />
    );
  }
  return null;
}
