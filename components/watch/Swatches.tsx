// Muestras pequeñas de las fichas del creador. Todo lo redondo es SVG (la web
// tiene un reset global `* { border-radius: 0 !important }`), y las fotos son
// las MISMAS capas del escenario, recortadas con CSS (.rl-thumb--*).
import { useId } from "react";
import {
  TRACK_SEQUENCES,
  WATCH_COLORS,
  WATCH_MATERIALS,
  WATCH_SPECS,
  beadAt,
  dialColorAt,
  type Esfera,
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
    <svg width={size} height={size} viewBox="0 0 28 28" className="rl-dot" focusable="false" aria-hidden="true">
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
  crop: "caja" | "esfera" | "correa" | "cabeza" | "tipo";
  fallbackHex?: string;
}) {
  const urls = layers.filter((u): u is string => !!u);
  if (!urls.length) return <ColorDot hex={fallbackHex ?? "#888"} size={44} />;
  return (
    <span
      className={`rl-thumb rl-thumb--${crop}`}
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
      className="rl-beads"
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
export function HandSwatch({ hex, dialHex, dialAbajo }: { hex: string; dialHex: string; dialAbajo?: string }) {
  const id = `pyjh${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const grad = dialAbajo && dialAbajo !== dialHex;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="rl-handsw" focusable="false" aria-hidden="true">
      {grad && (
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={dialHex} />
            <stop offset="1" stopColor={dialAbajo} />
          </linearGradient>
        </defs>
      )}
      <circle cx="22" cy="22" r="20" fill={grad ? `url(#${id})` : dialHex} stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
      <rect x="21.2" y="5" width="1.6" height="24" fill={hex} />
      <circle cx="22" cy="22" r="2.6" fill={hex} />
      <circle cx="22" cy="33" r="1.6" fill={hex} />
    </svg>
  );
}

/** Una esfera de degradado dibujada (círculo con el degradado real, muestreado
 *  con dialColorAt: la misma cuenta que pintó la capa). Para el ajuste 1–5. */
export function GradientDial({ esfera, size = 40 }: { esfera: Pick<Esfera, "base" | "degradado">; size?: number }) {
  const id = `pyjg${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const R = WATCH_SPECS.dialMm / 2;
  const stops = Array.from({ length: 9 }, (_, i) => i / 8);
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="rl-gdial" focusable="false" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          {stops.map((t) => (
            <stop key={t} offset={t} stopColor={dialColorAt(esfera, -R + 2 * R * t)} />
          ))}
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18.5" fill={`url(#${id})`} stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
      <ellipse cx="14.5" cy="12" rx="7" ry="3.6" fill="#fff" opacity="0.12" />
    </svg>
  );
}

/** Una esfera lisa de acabado sol: el color de la base con el brillo que se
 *  mueve con la luz (rayos suaves + reflejo). SVG, 44 px. */
export function SolSwatch({ hex, size = 44 }: { hex: string; size?: number }) {
  const id = `pyjs${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className="rl-sol" focusable="false" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}r`} cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity="0.34" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#000" stopOpacity="0.28" />
        </radialGradient>
      </defs>
      <circle cx="22" cy="22" r="20.5" fill={hex} />
      <g stroke="#fff" strokeOpacity="0.07" strokeWidth="1.2">
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 12;
          const dx = Math.cos(a) * 20;
          const dy = Math.sin(a) * 20;
          return <line key={i} x1={22 - dx} y1={22 - dy} x2={22 + dx} y2={22 + dy} />;
        })}
      </g>
      <circle cx="22" cy="22" r="20.5" fill={`url(#${id}r)`} stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
    </svg>
  );
}

/** Pictogramas de los cierres (64 px de alto en su tarjeta): hebilla de púa y
 *  desplegable (mariposa). Trazo fino en el color del texto. */
export function ClaspPictogram({ kind }: { kind: "puas" | "desplegable" }) {
  return (
    <svg viewBox="0 0 64 40" width="64" height="40" className="rl-clasp" focusable="false" aria-hidden="true">
      {kind === "puas" ? (
        <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
          <path d="M4 14h22M4 26h22" />
          <path d="M26 9h10c6 0 10 4.6 10 11s-4 11-10 11H26Z" />
          <path d="M26 20h17" strokeWidth="2.2" />
          <path d="M46 14h14M46 26h14" opacity="0.55" />
          <circle cx="54" cy="20" r="1.4" fill="currentColor" stroke="none" opacity="0.55" />
        </g>
      ) : (
        <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
          <path d="M4 14h12M4 26h12M48 14h12M48 26h12" />
          <path d="M16 11h32v18H16Z" />
          <path d="M22 11 32 20 42 11M22 29l10-9 10 9" opacity="0.7" />
          <circle cx="16" cy="20" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="48" cy="20" r="1.6" fill="currentColor" stroke="none" />
        </g>
      )}
    </svg>
  );
}
