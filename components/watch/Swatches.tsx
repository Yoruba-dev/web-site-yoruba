// Muestras pequeñas de las fichas del creador. Todo lo redondo es SVG (la web
// tiene un reset global `* { border-radius: 0 !important }`), y las fotos son
// las MISMAS capas del escenario, recortadas con CSS (.rl-thumb--*).
import { useId, type CSSProperties } from "react";
import {
  TRACK_SEQUENCES,
  WATCH_COLORS,
  WATCH_MATERIALS,
  WATCH_SPECS,
  beadAt,
  contrastRatio,
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
  crop: "caja" | "esfera" | "cabeza";
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

/** Contraste mínimo de un segundero con su esfera para dibujarlo sin perfil. */
const HAND_MIN = 1.6;

/** El perfil que separa el segundero de la esfera cuando los dos se parecen
 *  (un segundero rojo sobre una esfera roja): claro u oscuro, el que MÁS se
 *  aparte de los dos colores de la esfera. undefined = no hace falta. */
export function handOutline(hex: string, dialHex: string, dialAbajo = dialHex): string | undefined {
  // En un degradado, si su luz cae ENTRE las de los dos extremos, en algún punto
  // son iguales (1:1) aunque los extremos se aparten.
  const [ca, cz, ch] = [dialHex, dialAbajo, hex].map((c) => contrastRatio(c, "#ffffff"));
  const cruza = ch >= Math.min(ca, cz) && ch <= Math.max(ca, cz);
  const peor = (c: string) => Math.min(contrastRatio(c, dialHex), contrastRatio(c, dialAbajo));
  if (!cruza && peor(hex) >= HAND_MIN) return undefined;
  return peor("#ffffff") >= peor("#000000") ? "#ffffff" : "#000000";
}

/** El segundero de un color sobre la esfera elegida. */
export function HandSwatch({ hex, dialHex, dialAbajo }: { hex: string; dialHex: string; dialAbajo?: string }) {
  const id = `pyjh${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const grad = dialAbajo && dialAbajo !== dialHex;
  const perfil = handOutline(hex, dialHex, dialAbajo);
  const borde = perfil ? { stroke: perfil, strokeWidth: 0.8, strokeOpacity: 0.9 } : undefined;
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
      <rect x="20.9" y="5" width="2.2" height="25" fill={hex} {...borde} />
      <circle cx="22" cy="33" r="1.9" fill={hex} {...borde} />
      <circle cx="22" cy="22" r="2.9" fill={hex} {...borde} />
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

// ---------------------------------------------------------------------------
// VITRINA (decisión 19 del dueño): la pieza real, de pie en una balda de cristal
// con su nombre. Las imágenes salen de nuestras capas (scripts/gen-vitrina.py).
// ---------------------------------------------------------------------------

/** Tono de cada correa con foto: la mediana de su capa, la MISMA cifra que usa
 *  el 3D (three/materials.ts, STRAP_PHOTO_TONE, que no puede entrar en la
 *  primera carga). Para las ilustraciones de los cierres. */
const STRAP_TONO: Readonly<Record<string, string>> = {
  "caucho-negro": "#3c3c3d",
  "caucho-gris": "#767677",
  "caucho-blanco": "#ececea",
  "caucho-azul-marino": "#2f3c52",
  "caucho-azul": "#38598c",
  "caucho-naranja": "#ec7c3c",
  "caucho-verde": "#58624a",
  "caucho-rojo": "#9a3735",
  "caucho-tan": "#b48e66",
  "piel-verde": "#42564c",
  "piel-rojo": "#83302d",
  "piel-azul-marino": "#28374f",
};

/** Color de una correa tal como se ve en la foto y en el 3D (el del catálogo si
 *  aún no tiene foto). */
export function strapHex(id: string, swatch: string): string {
  return STRAP_TONO[id] ?? swatchHex(swatch);
}

/** La punta de una correa (o un tramo de brazalete), de pie, con su reflejo. */
export function VitrinaPiece({ src, hex }: { src?: string; hex: string }) {
  if (!src) return <ColorDot hex={hex} size={44} />;
  return <span className="rl-vitp" style={{ "--img": `url("${src}")` } as CSSProperties} />;
}

/** La caja en un acabado, con la esfera elegida dentro (paso Caja): las capas de
 *  600 px del escenario, encuadradas como el mini reloj. `capas`, de arriba
 *  abajo: aplique PY, índices, caja y esfera. */
export function CajaMuestra({ capas, hex }: { capas: readonly [string, string, string | undefined, string | undefined]; hex: string }) {
  const [aplique, indices, caja, esfera] = capas;
  if (!caja || !esfera) return <ColorDot hex={hex} size={44} />;
  return (
    <span
      className="rl-cajam"
      style={{ backgroundImage: [aplique, indices, caja, esfera].map((u) => `url("${u}")`).join(", ") }}
    />
  );
}

/** El mini reloj: la esfera dentro de la caja del paso 1, con sus índices. */
export function MiniWatch({ capas, hex }: { capas?: { indices: string; caja: string; dial: string }; hex: string }) {
  if (!capas) return <ColorDot hex={hex} size={44} />;
  return (
    <span
      className="rl-mini"
      style={{ backgroundImage: `url("${capas.indices}"), url("${capas.caja}"), url("${capas.dial}")` }}
    />
  );
}
