// Decorative frame for the SIDE faces — the real ring's shoulder: a straight-sided
// tapering panel (wide, lightly domed top → straight edges → a point at the band),
// with a beaded gold edge and a central pointed-arch "gate / tower" niche on a
// stepped base. The customer's Odù tower is engraved inside that gate; any sun/moon
// or other motifs are OPTIONAL and placed by the customer from the palette.
// Purely presentational; the middle stays open for the design canvas. viewBox 300×440.

const GOLD = "#f0d79b";
const GRAD = "url(#pyjShoulderGold)";

// beads traced by hand along the straight-sided outline (integers → no hydration drift)
const BEADS: [number, number, boolean][] = [
  [150, 34, false],
  [190, 41, true],
  [222, 51, false],
  [225, 110, true],
  [207, 180, false],
  [188, 260, true],
  [168, 340, false],
  [150, 410, true],
  [132, 340, false],
  [112, 260, true],
  [93, 180, false],
  [75, 110, true],
  [78, 51, false],
  [110, 41, true],
];

export default function ShoulderFrame({ gems }: { gems?: string[] }) {
  return (
    <svg
      className="pyj-shoulder-frame"
      viewBox="0 0 300 440"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="pyjShoulderGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4dca2" />
          <stop offset="0.5" stopColor="#cda557" />
          <stop offset="1" stopColor="#8f5f28" />
        </linearGradient>
        <radialGradient id="pyjShoulderOnyx" cx="0.5" cy="0.3" r="0.78">
          <stop offset="0" stopColor="#33261a" />
          <stop offset="0.5" stopColor="#170f08" />
          <stop offset="1" stopColor="#0a0704" />
        </radialGradient>
        <radialGradient id="pyjShoulderGloss" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff6e0" stopOpacity="0.4" />
          <stop offset="1" stopColor="#fff6e0" stopOpacity="0" />
        </radialGradient>
        <filter id="pyjShoulderShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.3" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* straight-sided shoulder panel — polished onyx + gold border */}
      <path
        d="M60 48 Q150 30 240 48 L152 405 Q150 416 148 405 L60 48 Z"
        fill="url(#pyjShoulderOnyx)"
        stroke={GRAD}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {/* glossy reflection near the top of the shoulder */}
      <ellipse cx="150" cy="118" rx="64" ry="56" fill="url(#pyjShoulderGloss)" />

      {/* gate + stepped base, lifted off the onyx with a soft shadow */}
      <g filter="url(#pyjShoulderShadow)">
        {/* the "+" that crowns the top-center */}
        <g fill={GOLD} transform="translate(150 62)">
          <rect x="-3" y="-11" width="6" height="22" rx="1.5" />
          <rect x="-9" y="-5" width="18" height="6" rx="1.5" />
        </g>
        <path
          d="M118 235 L121 152 Q127 110 150 96 Q173 110 179 152 L182 235 Z"
          fill="none"
          stroke={GRAD}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <rect x="110" y="240" width="80" height="6" rx="2" fill={GRAD} />
        <rect x="102" y="249" width="96" height="7" rx="2" fill={GRAD} />
      </g>

      {/* beaded edge — Orisha gems (alternating with gold), each with a glint */}
      {BEADS.map(([x, y, green], i) => (
        <g key={i}>
          <circle
            cx={x}
            cy={y}
            r="5"
            fill={
              gems && gems.length
                ? i % 2 === 1
                  ? GRAD
                  : gems[Math.floor(i / 2) % gems.length]
                : green
                  ? "#5f8f42"
                  : GRAD
            }
          />
          <circle cx={x - 1.6} cy={y - 1.9} r="1.4" fill="rgba(255,255,255,0.6)" />
        </g>
      ))}
    </svg>
  );
}
