// Muestras pequeñas de las fichas del creador. Todo lo redondo es SVG (la web
// tiene un reset global `* { border-radius: 0 !important }`), y las fotos son
// las MISMAS capas del escenario, recortadas con CSS (.pyj-reloj_thumb--*).
import {
  TRACK_SEQUENCES,
  WATCH_COLORS,
  WATCH_MATERIALS,
  beadAt,
  type OrishaId,
  type WatchColorId,
} from "@/lib/watch";

/** Hex de una muestra del catálogo: un WatchColorId o un material. */
export function swatchHex(swatch: string): string {
  if (swatch in WATCH_COLORS) return WATCH_COLORS[swatch as WatchColorId].hex;
  if (swatch in WATCH_MATERIALS) return WATCH_MATERIALS[swatch as keyof typeof WATCH_MATERIALS];
  return "#888888";
}

/** Un círculo de color con un brillo suave (correas, segunderos, colores). */
export function ColorDot({ hex, size = 28 }: { hex: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" className="pyj-reloj_dot" focusable="false" aria-hidden="true">
      <circle cx="14" cy="14" r="12.5" fill={hex} stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
      <ellipse cx="10.5" cy="9" rx="5" ry="3" fill="#fff" opacity="0.16" />
    </svg>
  );
}

/** Foto recortada de una o varias capas apiladas (la primera queda arriba). */
export function LayerThumb({
  layers,
  crop,
  fallbackHex,
}: {
  layers: (string | undefined)[];
  crop: "caja" | "esfera" | "correa";
  fallbackHex?: string;
}) {
  const urls = layers.filter((u): u is string => !!u);
  if (!urls.length) return <ColorDot hex={fallbackHex ?? "#888"} size={44} />;
  return (
    <span
      className={`pyj-reloj_thumb pyj-reloj_thumb--${crop}`}
      style={{ backgroundImage: urls.map((u) => `url("${u}")`).join(", ") }}
    />
  );
}

/** Las cuentas de la pista de un Orisha (las 10 primeras posiciones). */
export function BeadRow({ orisha, count = 8 }: { orisha: OrishaId; count?: number }) {
  const seq = TRACK_SEQUENCES[orisha];
  const step = 9;
  return (
    <svg
      width={count * step + 2}
      height="12"
      viewBox={`0 0 ${count * step + 2} 12`}
      className="pyj-reloj_beads"
      focusable="false"
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => {
        // El acento de Oyá cae en la posición 0; se muestra en la 1.ª cuenta.
        const b = beadAt(seq, i);
        const cx = 5 + i * step;
        return (
          <g key={i}>
            <circle cx={cx} cy="6" r="3.6" fill={WATCH_COLORS[b.color].hex} stroke="rgba(0,0,0,0.35)" strokeWidth="0.6" />
            {b.raya && <rect x={cx - 0.7} y="2.4" width="1.4" height="7.2" fill={WATCH_COLORS[b.raya].hex} />}
          </g>
        );
      })}
    </svg>
  );
}

/** El segundero de un color sobre la esfera elegida. */
export function HandSwatch({ hex, dialHex }: { hex: string; dialHex: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="pyj-reloj_handsw" focusable="false" aria-hidden="true">
      <circle cx="22" cy="22" r="20" fill={dialHex} stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
      <rect x="21.2" y="5" width="1.6" height="24" fill={hex} />
      <circle cx="22" cy="22" r="2.6" fill={hex} />
      <circle cx="22" cy="33" r="1.6" fill={hex} />
    </svg>
  );
}
