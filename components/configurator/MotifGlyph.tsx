import type { MotifId } from "@/lib/symbols";

// Draws a standalone symbol (motif) as inline SVG in currentColor. Add a new
// motif by adding a case here + an entry in lib/symbols.ts MOTIFS.
function Shapes({ motif }: { motif: MotifId }) {
  switch (motif) {
    case "sol": {
      const rays = Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return {
          x1: 50 + 25 * Math.cos(a),
          y1: 50 + 25 * Math.sin(a),
          x2: 50 + 41 * Math.cos(a),
          y2: 50 + 41 * Math.sin(a),
        };
      });
      return (
        <>
          <circle cx="50" cy="50" r="17" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="6" strokeLinecap="round">
            {rays.map((r, i) => (
              <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} />
            ))}
          </g>
        </>
      );
    }
    case "luna":
      return <path d="M62 12 a38 38 0 1 0 0 76 a30 30 0 1 1 0 -76 z" fill="currentColor" />;
    case "estrella":
      return (
        <path
          d="M50 6 L61 38 L95 39 L68 59 L78 92 L50 72 L22 92 L32 59 L5 39 L39 38 Z"
          fill="currentColor"
        />
      );
    case "rayo":
      return <path d="M58 5 L24 55 L45 55 L38 95 L76 42 L53 42 Z" fill="currentColor" />;
    case "cruz":
      return (
        <g fill="currentColor">
          <rect x="43" y="10" width="14" height="80" rx="2" />
          <rect x="26" y="32" width="48" height="14" rx="2" />
        </g>
      );
    case "ojo":
      return (
        <>
          <path
            d="M6 50 Q50 16 94 50 Q50 84 6 50 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
          />
          <circle cx="50" cy="50" r="13" fill="currentColor" />
        </>
      );
    case "corona":
      return (
        <g fill="currentColor">
          <path d="M16 72 L16 36 L33 53 L50 26 L67 53 L84 36 L84 72 Z" />
          <rect x="16" y="72" width="68" height="12" rx="2" />
        </g>
      );
    case "hacha":
      return (
        <g fill="currentColor">
          <rect x="46" y="30" width="8" height="62" rx="3" />
          <path d="M50 10 Q22 20 27 46 Q41 39 50 39 Q59 39 73 46 Q78 20 50 10 Z" />
        </g>
      );
    default:
      return null;
  }
}

export default function MotifGlyph({
  motif,
  name,
  className,
  decorative = false,
}: {
  motif: MotifId;
  name?: string;
  className?: string;
  decorative?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : name ?? motif}
      focusable="false"
    >
      <Shapes motif={motif} />
    </svg>
  );
}
