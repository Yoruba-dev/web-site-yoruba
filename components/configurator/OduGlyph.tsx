import { oduMarks, oduSignMarks, ODU_GLYPH, type Odu } from "@/lib/odu";

// Draws an Odù Meji from its binary pattern as inline SVG, inheriting color via
// `currentColor`. Pass `tower` to draw a SINGLE column (una torre) — the unit
// actually engraved on a ring face — otherwise both columns (the full sign).
//
// The bars come from oduMarks() in lib/odu.ts — the one geometry shared with the
// cart thumbnail, the watch dial and the laser file. Column convention: `left`
// is drawn on the viewer's left, `right` on the viewer's right; the RIGHT column
// (pierna derecha) is the one read first.
export default function OduGlyph({
  odu,
  tower,
  className,
  decorative = false,
}: {
  odu: Odu;
  tower?: "left" | "right";
  className?: string;
  decorative?: boolean;
}) {
  const viewW = tower ? ODU_GLYPH.colW : ODU_GLYPH.signW;
  const box = { x: 0, y: 0, w: viewW, h: ODU_GLYPH.colH };
  const rects = tower
    ? oduMarks(tower === "left" ? odu.left : odu.right, box)
    : oduSignMarks(odu, box);

  return (
    <svg
      viewBox={`0 0 ${viewW} ${ODU_GLYPH.colH}`}
      className={className}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={
        decorative
          ? undefined
          : `Signo de Ifá ${odu.name}${tower ? " (torre)" : ""}`
      }
      focusable="false"
    >
      {rects.map((r, i) => (
        <rect
          key={i}
          x={r.x}
          y={r.y}
          width={r.w}
          height={r.h}
          rx={r.rx}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}
