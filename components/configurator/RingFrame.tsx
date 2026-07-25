// Decorative medallion frame for the FRONT signet — modeled on the real ring: an
// outer gem halo (colored by the wearer's Orisha), a gold band, a RED pavé center
// where the Odù (gold bars) are engraved, and the fixed emblems that crown the
// piece — cross (top), sun (right), moon (left), skull & bones (bottom). Purely
// presentational; the central red field is left open for the design canvas. 400×400.
import type { ReactNode } from "react";

const GOLD = "#f0d79b";
const DARK = "#1c130b";

function Cross() {
  return (
    <g fill={GOLD}>
      <rect x="-5" y="-19" width="10" height="38" rx="2.5" />
      <rect x="-15" y="-8" width="30" height="10" rx="2.5" />
    </g>
  );
}
function Sun() {
  return (
    <g>
      <circle r="8" fill={GOLD} />
      <g stroke={GOLD} strokeWidth="3" strokeLinecap="round">
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={Math.round(11 * Math.cos(a))}
              y1={Math.round(11 * Math.sin(a))}
              x2={Math.round(17 * Math.cos(a))}
              y2={Math.round(17 * Math.sin(a))}
            />
          );
        })}
      </g>
    </g>
  );
}
function Moon() {
  return (
    <g>
      <circle cx="-3" cy="0" r="15" fill={GOLD} />
      <circle cx="4" cy="-2" r="13" fill={DARK} />
    </g>
  );
}
function Skull() {
  return (
    <g>
      <g stroke={GOLD} strokeWidth="4" strokeLinecap="round">
        <line x1="-15" y1="11" x2="15" y2="-4" />
        <line x1="-15" y1="-4" x2="15" y2="11" />
      </g>
      <path
        d="M0 -16 C9 -16 13 -9 13 -3 C13 3 10 7 8 8 L8 12 C8 13 7 14 4 14 L-4 14 C-7 14 -8 13 -8 12 L-8 8 C-10 7 -13 3 -13 -3 C-13 -9 -9 -16 0 -16 Z"
        fill={GOLD}
      />
      <circle cx="-5" cy="-3" r="3" fill={DARK} />
      <circle cx="5" cy="-3" r="3" fill={DARK} />
      <path d="M0 2 l-2 4 h4 Z" fill={DARK} />
    </g>
  );
}

// on the red field's outer edge (r≈133), scaled down so they ring the central Odù
const EMBLEMS: { x: number; y: number; el: ReactNode }[] = [
  { x: 200, y: 67, el: <Cross /> },
  { x: 333, y: 200, el: <Sun /> },
  { x: 200, y: 333, el: <Skull /> },
  { x: 67, y: 200, el: <Moon /> },
];

export default function RingFrame({ gems }: { gems?: string[] }) {
  const beads = Array.from({ length: 44 }, (_, i) => {
    const a = (i / 44) * Math.PI * 2;
    return {
      x: Math.round(200 + 188 * Math.cos(a)),
      y: Math.round(200 + 188 * Math.sin(a)),
      fill:
        gems && gems.length
          ? i % 2 === 1
            ? "url(#pyjFrameGold)"
            : gems[Math.floor(i / 2) % gems.length]
          : i % 3 === 1
            ? "#5f8f42"
            : "url(#pyjFrameGold)",
    };
  });

  return (
    <svg
      className="pyj-face_medallion"
      viewBox="0 0 400 400"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="pyjFrameGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4dca2" />
          <stop offset="0.5" stopColor="#cda557" />
          <stop offset="1" stopColor="#8f5f28" />
        </linearGradient>
        <radialGradient id="pyjOnyx" cx="0.42" cy="0.36" r="0.72">
          <stop offset="0" stopColor="#3a2c1d" />
          <stop offset="0.5" stopColor="#191009" />
          <stop offset="1" stopColor="#0a0704" />
        </radialGradient>
        <radialGradient id="pyjGloss" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff6e0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff6e0" stopOpacity="0" />
        </radialGradient>
        <filter id="pyjEmbShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.6" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* body + outer gold rim */}
      <circle cx="200" cy="200" r="197" fill="#181009" />
      <circle cx="200" cy="200" r="196" fill="none" stroke="url(#pyjFrameGold)" strokeWidth="4" />
      {/* inner gold band that rings the onyx field, with a polished bright edge */}
      <circle cx="200" cy="200" r="150" fill="none" stroke="url(#pyjFrameGold)" strokeWidth="9" />
      <circle cx="200" cy="200" r="145.5" fill="none" stroke="rgba(255,244,205,0.4)" strokeWidth="1.4" />

      {/* polished onyx center (the field the Odù bars sit on) + a glossy reflection */}
      <circle cx="200" cy="200" r="141" fill="url(#pyjOnyx)" />
      <ellipse cx="168" cy="150" rx="74" ry="44" fill="url(#pyjGloss)" />
      <circle cx="200" cy="200" r="141" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="2" />

      {/* fixed emblems ringing the central Odù, lifted off the onyx with a shadow */}
      <g filter="url(#pyjEmbShadow)">
        {EMBLEMS.map((e, i) => (
          <g key={i} transform={`translate(${e.x} ${e.y}) scale(0.72)`}>
            {e.el}
          </g>
        ))}
      </g>

      {/* beaded gem halo — each stone gets a small specular glint */}
      {beads.map((b, i) => (
        <g key={i}>
          <circle cx={b.x} cy={b.y} r="6.5" fill={b.fill} />
          <circle cx={b.x - 2} cy={b.y - 2.4} r="1.7" fill="rgba(255,255,255,0.6)" />
        </g>
      ))}
    </svg>
  );
}
