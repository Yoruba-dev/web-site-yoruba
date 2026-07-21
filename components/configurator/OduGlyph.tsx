import type { Odu } from "@/lib/odu";

// Draws an Odù Meji from its binary pattern as inline SVG, inheriting color via
// `currentColor`. Pass `tower` to draw a SINGLE column (una torre) — the unit
// actually engraved on a ring face — otherwise both columns (the full sign).
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
  const columns = tower
    ? [{ cx: 25, marks: tower === "left" ? odu.left : odu.right }]
    : [
        { cx: 27, marks: odu.left },
        { cx: 73, marks: odu.right },
      ];
  const viewW = tower ? 50 : 100;
  const rowY = [8, 33, 58, 83];
  const markH = 15;
  const half = 7;

  return (
    <svg
      viewBox={`0 0 ${viewW} 106`}
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
      {columns.flatMap((col) =>
        col.marks.flatMap((mark, r) => {
          const xs = mark === 2 ? [col.cx - half, col.cx + half] : [col.cx];
          return xs.map((x, i) => (
            <rect
              key={`${col.cx}-${r}-${i}`}
              x={x - 2.5}
              y={rowY[r]}
              width={5}
              height={markH}
              rx={2}
              fill="currentColor"
            />
          ));
        }),
      )}
    </svg>
  );
}
