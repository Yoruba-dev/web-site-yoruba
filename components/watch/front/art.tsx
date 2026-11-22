// ---------------------------------------------------------------------------
// ARTE DEL COMPOSITOR REALISTA — lo que va ENCIMA de las fotos de capa.
//
// Todo está en el lienzo de la plantilla (viewBox 0 0 1200 1600, centro de la
// esfera en (600, 800)); las piezas en mm de lib/watch-art.ts entran con
// MM_TRANSFORM (16.39 px/mm). Nada de geometría propia: la impresión es
// primitivesToSvg(dialPrimitives) tal cual (las mismas cifras que el archivo de
// impresión), los índices y la fecha son las primitivas 'aplicado'/'ventana',
// y las agujas son HANDS en handPose(c). Aquí solo se añade cómo se VEN: tinta
// con un relieve mínimo, metal pulido con su sombra, lume, cristal.
//
// Un solo hook (useOutline, ./curvas): las letras de PrintArt y CasebackArt
// salen con los MISMOS contornos que el archivo de imprenta en cuanto carga
// la tabla; antes (y al hidratar), con la fuente de la web. El arnés
// (scripts/render-watchfront.tsx) la carga antes de pintar, así que sus
// capturas ya salen en curvas. Los filtros van en px de la plantilla (se
// aplican a un <g> exterior al MM_TRANSFORM), así que las sombras miden lo
// mismo en cualquier tamaño de pantalla.
//
// Prefijos de ids: `p` = los de la instancia (filtros y recortes, iguales para
// cualquier reloj, en <FrontDefs>); `q` = los de UNA capa (degradados que
// dependen del reloj: así, durante un fundido, la capa vieja conserva sus
// colores y la nueva trae los suyos).
//
// dangerouslySetInnerHTML: solo con la salida de primitivesToSvg(), que escapa
// todo texto con escapeXml() y toma colores y cifras de tablas internas.
// ---------------------------------------------------------------------------
import { Fragment, type ReactNode } from "react";
import {
  HANDS,
  casebackPrimitives,
  dialPrimitives,
  fmt,
  handAngles,
  handMetalHex,
  handPose,
  primitivesToSvg,
  rimMetalHex,
  type Primitive,
  type RectPrim,
} from "@/lib/watch-art";
import { WATCH_COLORS, WATCH_MATERIALS, getDialBase, getSecondsPart, type FinishId, type WatchConfig } from "@/lib/watch";
import { MM_TRANSFORM, PLANTILLA, R_VENTANA_PX, TAPA_FOTO, tapaUrl } from "@/lib/watch-capas";
import { useOutline } from "./curvas";

const { CX, CY, PX_POR_MM } = PLANTILLA;
const f = (n: number) => fmt(n, 3);

/** Región de los filtros de la esfera (px de la plantilla): todo cabe aquí. */
const DIAL_REGION = { x: CX - 280, y: CY - 280, width: 560, height: 560 } as const;

// ===========================================================================
// Color
// ===========================================================================
function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

/** `a` → `b` en la proporción t (0–1). */
export function mix(a: string, b: string, t: number): string {
  const A = rgb(a);
  const B = rgb(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

/** Escala de un metal pulido a partir de su tono (de sombra a reflejo). */
function metalScale(hex: string) {
  return {
    white: mix(hex, "#ffffff", 0.82),
    light: mix(hex, "#ffffff", 0.45),
    base: hex,
    dark: mix(hex, "#000000", 0.4),
    deep: mix(hex, "#000000", 0.66),
  };
}

/** Color de una faceta pulida según hacia dónde mira: la luz del estudio viene
 *  de arriba a la izquierda (la misma que proyecta todas las sombras hacia
 *  abajo a la derecha). `b` = −1 (de espaldas) … 1 (de cara a la luz). */
function facet(hex: string, b: number): string {
  const s = metalScale(hex);
  const t = Math.max(0, Math.min(1, (b + 1) / 2));
  const stops = [s.deep, s.dark, s.base, s.light, s.white];
  const x = t * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  return mix(stops[i], stops[i + 1], x - i);
}

/** Hacia la luz (normalizado): arriba a la izquierda. */
const LIGHT = (() => {
  const v = [-0.55, -0.83];
  const n = Math.hypot(v[0], v[1]);
  return [v[0] / n, v[1] / n] as const;
})();

/** Brillo de la faceta izquierda de una aguja girada `deg` (horario, 0 = 12):
 *  su normal local (−1, 0) llevada al mundo, contra la luz. */
function leftFacetLight(deg: number): number {
  const a = (deg * Math.PI) / 180;
  return -Math.cos(a) * LIGHT[0] - Math.sin(a) * LIGHT[1];
}

/** Lume según el pigmento de la esfera: de día, núcleo de noche, halo de noche. */
export function lumeTones(c: WatchConfig): { dia: string; nucleo: string; halo: string } {
  const pigment = getDialBase(c.esfera.base)?.lume ?? "C3";
  return pigment === "BGW9"
    ? { dia: "#e6eef2", nucleo: "#e3f6ff", halo: "#5cc8ff" }
    : { dia: WATCH_MATERIALS.lume, nucleo: "#e4ffe9", halo: "#5dff92" };
}

const secondsHex = (c: WatchConfig) => WATCH_COLORS[getSecondsPart(c.segundero)?.color ?? "negro"].hex;

/** Lume convexo: más claro arriba a la izquierda. */
function LumeGradient({ id, c }: { id: string; c: WatchConfig }) {
  const dia = lumeTones(c).dia;
  return (
    <radialGradient id={id} cx="0.38" cy="0.32" r="0.78">
      <stop offset="0" stopColor={mix(dia, "#ffffff", 0.6)} />
      <stop offset="0.6" stopColor={dia} />
      <stop offset="1" stopColor={mix(dia, "#55604f", 0.24)} />
    </radialGradient>
  );
}

// ===========================================================================
// <FrontDefs> — filtros y recortes de la instancia (no dependen del reloj).
// ===========================================================================
type Shadow = { blur: number; dx: number; dy: number; op: number };

function shadowFilter(id: string, layers: Shadow[]) {
  // Sombra a mano (desenfoque del alfa → desplazamiento → color): feDropShadow
  // dejaría además una silueta negra bajo los bordes suavizados (filo sucio).
  return (
    <filter id={id} filterUnits="userSpaceOnUse" {...DIAL_REGION} colorInterpolationFilters="sRGB">
      {layers.map((l, i) => (
        <Fragment key={i}>
          <feGaussianBlur in="SourceAlpha" stdDeviation={l.blur} result={`b${i}`} />
          <feOffset in={`b${i}`} dx={l.dx} dy={l.dy} result={`o${i}`} />
          <feFlood floodColor="#000" floodOpacity={l.op} result={`c${i}`} />
          <feComposite in={`c${i}`} in2={`o${i}`} operator="in" result={`s${i}`} />
        </Fragment>
      ))}
      <feMerge>
        {layers.map((_, i) => (
          <feMergeNode key={i} in={`s${i}`} />
        ))}
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}

/** Las sombras, en px de la plantilla. La luz viene de arriba a la izquierda:
 *  todo proyecta hacia abajo a la derecha, más lejos cuanto más alto está. */
export const SOMBRAS = {
  /** Tinta: micras de relieve; la letra sigue nítida. */
  tinta: [{ blur: 0.35, dx: 0.4, dy: 0.65, op: 0.3 }],
  /** Índices aplicados (≈0.3 mm): contacto + proyectada. */
  aplicado: [
    { blur: 1.7, dx: 2.0, dy: 3.0, op: 0.42 },
    { blur: 0.45, dx: 0.5, dy: 0.8, op: 0.5 },
  ],
  aplique: [
    { blur: 2.0, dx: 2.4, dy: 3.6, op: 0.48 },
    { blur: 0.5, dx: 0.6, dy: 0.9, op: 0.5 },
  ],
  hora: [{ blur: 1.6, dx: 2.6, dy: 3.9, op: 0.42 }],
  minuto: [{ blur: 2.0, dx: 3.6, dy: 5.4, op: 0.4 }],
  segundo: [{ blur: 1.8, dx: 4.8, dy: 7.2, op: 0.36 }],
} as const satisfies Record<string, Shadow[]>;

export function FrontDefs({ p }: { p: string }) {
  return (
    <defs>
      {(Object.keys(SOMBRAS) as (keyof typeof SOMBRAS)[]).map((k) => (
        <Fragment key={k}>{shadowFilter(`${p}-sh-${k}`, [...SOMBRAS[k]])}</Fragment>
      ))}
      {/* Cristal: sombra del bisel sobre la esfera (desplazada abajo-derecha:
          la pared de arriba a la izquierda tapa la luz) y un reflejo suave. */}
      <radialGradient id={`${p}-vineta`} gradientUnits="userSpaceOnUse" cx={CX + 7} cy={CY + 10} r={R_VENTANA_PX + 4}>
        <stop offset="0.8" stopColor="#000" stopOpacity="0" />
        <stop offset="0.94" stopColor="#000" stopOpacity="0.15" />
        <stop offset="1" stopColor="#000" stopOpacity="0.4" />
      </radialGradient>
      <radialGradient id={`${p}-reflejo`} gradientUnits="userSpaceOnUse" cx={CX - 250} cy={CY - 290} r="430">
        <stop offset="0" stopColor="#fff" stopOpacity="0.2" />
        <stop offset="0.55" stopColor="#fff" stopOpacity="0.05" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${p}-filo`} gradientUnits="userSpaceOnUse" x1={CX - 230} y1={CY + 40} x2={CX + 40} y2={CY - 232}>
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.45" stopColor="#fff" stopOpacity="0.45" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <clipPath id={`${p}-ventana`}>
        <circle cx={CX} cy={CY} r={R_VENTANA_PX} />
      </clipPath>
    </defs>
  );
}

// ===========================================================================
// Capas del frente
// ===========================================================================
/** En mm, dentro de un grupo en px de la plantilla (los filtros miden en px). */
function Mm({ children, filter }: { children: ReactNode; filter?: string }) {
  return (
    <g filter={filter}>
      <g transform={MM_TRANSFORM}>{children}</g>
    </g>
  );
}

/** La impresión del taller: pista, texto a las 6 y signo (o los 16 Meyis),
 *  exactamente como en dialPrintSvgCurvas: mismas primitivas y, en cuanto
 *  carga la tabla (./curvas), las MISMAS letras en curvas que la imprenta. */
export function PrintArt({ c, p, q }: { c: WatchConfig; p: string; q: string }) {
  const outline = useOutline();
  const raw = dialPrimitives(c).filter((x) => x.capa === "impresion");
  const prims = outline ? outline(raw) : raw;
  const svg = primitivesToSvg(prims, { idPrefix: `${q}-imp`, decimals: 3 });
  return (
    <g clipPath={`url(#${p}-ventana)`}>
      <g filter={`url(#${p}-sh-tinta)`}>
        <g transform={MM_TRANSFORM} dangerouslySetInnerHTML={{ __html: svg }} />
      </g>
    </g>
  );
}

/** Forma de una primitiva como elemento React (círculo, rectángulo o trazo). */
function shape(x: Primitive, props: Record<string, string | number | undefined>, key?: string | number): ReactNode {
  switch (x.kind) {
    case "circle":
      return <circle key={key} cx={f(x.cx)} cy={f(x.cy)} r={f(x.r)} {...props} />;
    case "rect": {
      const rot = x.rotate ? `rotate(${f(x.rotate)} ${f(x.x + x.w / 2)} ${f(x.y + x.h / 2)})` : undefined;
      return <rect key={key} x={f(x.x)} y={f(x.y)} width={f(x.w)} height={f(x.h)} rx={x.rx ? f(x.rx) : undefined} transform={rot} {...props} />;
    }
    case "path":
      return <path key={key} d={x.d} strokeLinejoin={x.strokeLinejoin} {...props} />;
    default:
      return null;
  }
}

/** Ventana de fecha (disco blanco con un "8") y las piezas aplicadas: marco de
 *  la fecha, puntos, triángulo y barras — acero pulido con lume dentro. */
export function AppliedArt({ c, p, q }: { c: WatchConfig; p: string; q: string }) {
  const prims = dialPrimitives(c);
  const win = prims.find((x): x is RectPrim => x.kind === "rect" && x.id === "ventana-fecha");
  const applied = prims.filter((x) => x.capa === "aplicado" && x.id !== "aplique");
  const rim = metalScale(rimMetalHex(c));
  const lume = WATCH_MATERIALS.lume;
  const edge = (x: Primitive, w: number) => shape(x, { fill: "none", stroke: "#15181b", strokeWidth: f(w + 0.08), strokeOpacity: 0.5 });
  return (
    <>
      <defs>
        {/* Acero pulido: refleja el estudio en bandas (luz, sombra, luz). */}
        <linearGradient id={`${q}-aro`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={rim.white} />
          <stop offset="0.3" stopColor={rim.light} />
          <stop offset="0.52" stopColor={rim.deep} />
          <stop offset="0.74" stopColor={rim.light} />
          <stop offset="1" stopColor={rim.dark} />
        </linearGradient>
        <LumeGradient id={`${q}-lume`} c={c} />
        {/* Disco de fecha visto por la ventana: el canto de la esfera le hace sombra. */}
        <linearGradient id={`${q}-fecha`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.45" />
          <stop offset="0.3" stopColor="#000" stopOpacity="0.07" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
      </defs>
      {win && (
        <Mm>
          <rect x={f(win.x)} y={f(win.y)} width={f(win.w)} height={f(win.h)} fill="#f3f2ee" />
          <text
            x={f(win.x + win.w / 2)}
            y={f(win.y + win.h / 2 + 0.56)}
            fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
            fontSize="1.58"
            fontWeight="600"
            textAnchor="middle"
            fill="#161616"
          >
            8
          </text>
          <rect x={f(win.x)} y={f(win.y)} width={f(win.w)} height={f(win.h)} fill={`url(#${q}-fecha)`} />
        </Mm>
      )}
      <Mm filter={`url(#${p}-sh-aplicado)`}>
        {applied.map((x, i) => {
          const w = x.strokeWidth ?? 0.2;
          // Filo oscuro a los dos lados del aro: la pieza se despega de la esfera.
          return (
            <g key={i}>
              {edge(x, w)}
              {shape(x, { fill: x.fill === lume ? `url(#${q}-lume)` : "none", stroke: `url(#${q}-aro)`, strokeWidth: f(w) })}
            </g>
          );
        })}
      </Mm>
    </>
  );
}

/** Proporciones del dibujo dentro de logo-py-*.webp (512 × 512): el arte va de
 *  x 14 a 498 y ocupa todo el alto (medido con getbbox()). */
const LOGO_ART_ASPECT = (498 - 14) / 512;

/** El aplique PY en su hueco ('aplique' de dialPrimitives), encajado sin
 *  salirse de la caja del plano (5 × 6 mm). */
export function AppliqueArt({ c, p, href }: { c: WatchConfig; p: string; href: string }) {
  const slot = dialPrimitives(c).find((x): x is RectPrim => x.kind === "rect" && x.id === "aplique");
  if (!slot) return null;
  const artH = Math.min(slot.h, slot.w / LOGO_ART_ASPECT);
  // La imagen es cuadrada y el arte ocupa todo su alto: lado = alto del arte.
  const x = slot.x + slot.w / 2 - artH / 2;
  const y = slot.y + (slot.h - artH) / 2;
  return (
    <Mm filter={`url(#${p}-sh-aplique)`}>
      <image href={href} x={f(x)} y={f(y)} width={f(artH)} height={f(artH)} preserveAspectRatio="xMidYMid meet" />
    </Mm>
  );
}

// Lume de las agujas: las mismas formas que hands() de lib/watch-svg.ts.
const HOUR_LUME = "M-0.44 -1.7L-0.44 -6.35L0 -7.3L0.44 -6.35L0.44 -1.7Z";
const MINUTE_LUME = "M-0.32 -2L-0.32 -11.15L0 -11.95L0.32 -11.15L0.32 -2Z";

type Blade = { readonly tail: number; readonly tip: number; readonly shoulder: number; readonly halfW: number };

/** Aguja de espada pulida: dos facetas (una a la luz, otra en sombra), filo
 *  central brillante y el lume encima. */
function swordHand(b: Blade, deg: number, metalHex: string, lumePath: string, q: string): ReactNode {
  const lit = leftFacetLight(deg);
  const left = `M${-b.halfW} ${b.tail}L${-b.halfW} ${-b.shoulder}L0 ${-b.tip}L0 ${b.tail}Z`;
  const right = `M0 ${b.tail}L0 ${-b.tip}L${b.halfW} ${-b.shoulder}L${b.halfW} ${b.tail}Z`;
  const outline = `M${-b.halfW} ${b.tail}L${-b.halfW} ${-b.shoulder}L0 ${-b.tip}L${b.halfW} ${-b.shoulder}L${b.halfW} ${b.tail}Z`;
  return (
    <g transform={`rotate(${f(deg)})`}>
      <path d={left} fill={facet(metalHex, lit * 0.92)} />
      <path d={right} fill={facet(metalHex, -lit * 0.92)} />
      <path d={`M0 ${b.tail - 0.3}L0 ${-b.tip + 0.05}`} stroke="#ffffff" strokeOpacity="0.55" strokeWidth="0.05" />
      <path d={outline} fill="none" stroke={mix(metalHex, "#000000", 0.62)} strokeWidth="0.05" strokeLinejoin="round" />
      <path d={lumePath} fill={`url(#${q}-lume)`} stroke={mix(WATCH_MATERIALS.lume, "#3f473c", 0.45)} strokeWidth="0.035" />
    </g>
  );
}

/** Agujas en handPose(c) (10:10:40; la Esfera Ifá, la suya), cada una con su
 *  sombra sobre la esfera. Segundero del color elegido: punta de triángulo
 *  hueco, punto luminoso con aro y contrapeso redondo. */
export function HandsArt({ c, p, q }: { c: WatchConfig; p: string; q: string }) {
  const metal = handMetalHex(c);
  const m = metalScale(metal);
  const sec = secondsHex(c);
  const secEdge = mix(sec, "#000000", 0.35);
  const ang = handAngles(handPose(c));
  const S = HANDS.seconds;
  const neck = S.tip - S.head.len;
  return (
    <>
      <defs>
        <LumeGradient id={`${q}-lume`} c={c} />
        <radialGradient id={`${q}-eje`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={m.white} />
          <stop offset="0.55" stopColor={m.base} />
          <stop offset="1" stopColor={m.dark} />
        </radialGradient>
        <radialGradient id={`${q}-contrapeso`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={mix(sec, "#ffffff", 0.35)} />
          <stop offset="0.6" stopColor={sec} />
          <stop offset="1" stopColor={mix(sec, "#000000", 0.35)} />
        </radialGradient>
      </defs>
      <Mm filter={`url(#${p}-sh-hora)`}>{swordHand(HANDS.hour, ang.hour, metal, HOUR_LUME, q)}</Mm>
      <Mm filter={`url(#${p}-sh-minuto)`}>{swordHand(HANDS.minute, ang.minute, metal, MINUTE_LUME, q)}</Mm>
      <Mm filter={`url(#${p}-sh-segundo)`}>
        <g transform={`rotate(${f(ang.seconds)})`}>
          <path
            d={`M${-S.halfW} ${S.tail}L${-S.halfW} ${f(-neck)}L${S.halfW} ${f(-neck)}L${S.halfW} ${S.tail}Z`}
            fill={sec}
            stroke={secEdge}
            strokeWidth="0.025"
          />
          {/* Punta: triángulo hueco (el trazo queda dentro de HANDS.seconds.head). */}
          <path
            d={`M${f(-S.head.halfW + 0.06)} ${f(-neck + 0.05)}L0 ${f(-S.tip + 0.09)}L${f(S.head.halfW - 0.06)} ${f(-neck + 0.05)}Z`}
            fill="none"
            stroke={sec}
            strokeWidth="0.12"
            strokeLinejoin="round"
          />
          <circle cx="0" cy={-S.lume.at} r={S.lume.r} fill={`url(#${q}-lume)`} stroke={sec} strokeWidth={S.lume.ring} />
          <circle cx="0" cy={S.counter.at} r={S.counter.r} fill={`url(#${q}-contrapeso)`} stroke={secEdge} strokeWidth="0.04" />
        </g>
        {/* Eje: tubo de la horaria, tapa del segundero y pivote. */}
        <circle cx="0" cy="0" r="1.15" fill={`url(#${q}-eje)`} stroke={m.deep} strokeWidth="0.06" />
        <circle cx="0" cy="0" r="0.62" fill={`url(#${q}-contrapeso)`} />
        <circle cx="0" cy="0" r="0.2" fill={m.white} />
      </Mm>
    </>
  );
}

/** El cristal: sombra del bisel en el borde de la esfera y un reflejo curvo
 *  muy suave arriba a la izquierda. Nunca tapa lo impreso. */
export function GlassArt({ p }: { p: string }) {
  const R = R_VENTANA_PX;
  const pt = (r: number, a: number) => {
    const t = (a * Math.PI) / 180;
    return `${f(CX + r * Math.sin(t))} ${f(CY - r * Math.cos(t))}`;
  };
  // Filo de luz: arco fino junto al borde, de las 8 a casi las 12.
  const arc = `M${pt(R - 9, 238)}A${R - 9} ${R - 9} 0 0 1 ${pt(R - 9, 352)}`;
  return (
    <g clipPath={`url(#${p}-ventana)`}>
      <circle cx={CX} cy={CY} r={R} fill={`url(#${p}-vineta)`} />
      <circle cx={CX} cy={CY} r={R} fill={`url(#${p}-reflejo)`} />
      <path d={arc} fill="none" stroke={`url(#${p}-filo)`} strokeWidth="5" strokeLinecap="round" />
    </g>
  );
}

// ===========================================================================
// Sombra del reloj sobre el fondo (debajo de la correa).
// ===========================================================================
/** Silueta de la caja de la plantilla (borde izquierdo, medido cada 38 px
 *  sobre el alfa de caja-acero-1200.webp; la derecha es su espejo, sin la
 *  corona). Solo sirve de sombra: va muy difuminada. */
const CASE_EDGE: readonly [number, number][] = [
  [430, 429], [468, 401], [506, 387], [544, 371], [582, 354], [620, 331], [658, 306], [696, 282], [734, 276],
  [772, 272], [810, 272], [848, 273], [886, 279], [924, 289], [962, 320], [1000, 343], [1038, 362], [1076, 377],
  [1114, 391], [1152, 403], [1188, 410],
];
const CASE_SHADOW_PATH = (() => {
  const left = CASE_EDGE.map(([y, x]) => `${x} ${y}`);
  const right = [...CASE_EDGE].reverse().map(([y, x]) => `${PLANTILLA.W - x} ${y}`);
  // Con la ventana hueca (evenodd): mientras se arma, la caja vacía deja ver
  // el fondo, no una mancha gris (luego la tapa el disco de la esfera).
  const R = PLANTILLA.R_ABERTURA;
  const hole = `M${CX - R} ${CY}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0Z`;
  return `M${left.join("L")}L${right.join("L")}Z${hole}`;
})();

export function ShadowArt({ p }: { p: string }) {
  return (
    <>
      <defs>
        {/* Regiones ajustadas a cada sombra (en px de la plantilla, ya
            desplazada): el desenfoque no recorre el lienzo entero. */}
        <filter id={`${p}-sombra`} filterUnits="userSpaceOnUse" x="180" y="340" width="860" height="980">
          <feGaussianBlur stdDeviation="24" />
        </filter>
        <filter id={`${p}-sombra-correa`} filterUnits="userSpaceOnUse" x="370" y="110" width="480" height="1420">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id={`${p}-contacto`} filterUnits="userSpaceOnUse" x="240" y="400" width="740" height="830">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {/* La correa apenas se separa del fondo; la caja, mucho más. */}
      <rect x="426" y="160" width="360" height="1280" rx="40" fill="#000" opacity="0.12" filter={`url(#${p}-sombra-correa)`} transform="translate(8 14)" />
      <path d={CASE_SHADOW_PATH} fillRule="evenodd" fill="#000" opacity="0.3" filter={`url(#${p}-sombra)`} transform="translate(14 30)" />
      <path d={CASE_SHADOW_PATH} fillRule="evenodd" fill="#000" opacity="0.22" filter={`url(#${p}-contacto)`} transform="translate(3 7)" />
    </>
  );
}

// ===========================================================================
// Modo noche: todo casi negro menos el lume, que brilla (verde en C3).
// ===========================================================================
export function NightArt({ c, p }: { c: WatchConfig; p: string }) {
  const t = lumeTones(c);
  const lume = WATCH_MATERIALS.lume;
  const applied = dialPrimitives(c).filter((x) => x.capa === "aplicado" && x.fill === lume);
  const ang = handAngles(handPose(c));
  const S = HANDS.seconds;
  return (
    <>
      <defs>
        <radialGradient id={`${p}-noche`} gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r="900">
          <stop offset="0" stopColor="#0a110d" />
          <stop offset="1" stopColor="#010202" />
        </radialGradient>
        <filter id={`${p}-brillo`} filterUnits="userSpaceOnUse" {...DIAL_REGION} colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3.5" result="b1" />
          <feFlood floodColor={t.halo} floodOpacity="0.85" />
          <feComposite in2="b1" operator="in" result="g1" />
          <feGaussianBlur in="SourceAlpha" stdDeviation="11" result="b2" />
          <feFlood floodColor={t.halo} floodOpacity="0.4" />
          <feComposite in2="b2" operator="in" result="g2" />
          <feMerge>
            <feMergeNode in="g2" />
            <feMergeNode in="g1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x="0" y="0" width={PLANTILLA.W} height={PLANTILLA.H} fill={`url(#${p}-noche)`} opacity="0.955" />
      <Mm filter={`url(#${p}-brillo)`}>
        {/* Índices: solo el lume (de noche el aro de metal no se ve). */}
        {applied.map((x, i) => {
          const w = x.strokeWidth ?? 0.2;
          const inner: Primitive =
            x.kind === "circle"
              ? { ...x, r: x.r - w / 2 }
              : x.kind === "rect"
                ? { ...x, x: x.x + w / 2, y: x.y + w / 2, w: x.w - w, h: x.h - w }
                : x;
          return shape(inner, { fill: t.nucleo }, i);
        })}
        <path d={HOUR_LUME} fill={t.nucleo} transform={`rotate(${f(ang.hour)})`} />
        <path d={MINUTE_LUME} fill={t.nucleo} transform={`rotate(${f(ang.minute)})`} />
        <circle cx="0" cy={-S.lume.at} r={f(S.lume.r - S.lume.ring / 2)} fill={t.nucleo} transform={`rotate(${f(ang.seconds)})`} />
      </Mm>
    </>
  );
}

// ===========================================================================
// TAPA — la foto real de una tapa lisa, en el acabado de la caja, con el
// grabado láser encima (derecho, sin espejo, 12 arriba).
// ===========================================================================
/** Tinte de la foto de acero para cada acabado (medido sobre las capas de
 *  caja: oro rosa ≈ luminancia × (1.15, 0.965, 0.83); negro PVD ≈ 0.3 ×
 *  luminancia + 0.18). Matrices de feColorMatrix (fila R, G, B, A). */
const TAPA_TINTE: Readonly<Record<FinishId, string | null>> = {
  acero: null,
  "oro-rosa": "0.2445 0.8225 0.083 0 0  0.2052 0.6902 0.0697 0 0  0.1765 0.5936 0.0599 0 0  0 0 0 1 0",
  "pvd-negro": "0.0638 0.2146 0.0217 0 0.176  0.0638 0.2146 0.0217 0 0.176  0.0617 0.2074 0.0209 0 0.168  0 0 0 1 0",
};

/** Lo grabado por acabado: el láser oscurece el acero y el oro rosa; en el
 *  negro PVD quita la capa y deja ver el acero claro. `luz` = el canto del
 *  surco que recibe la luz (abajo a la derecha). */
const GRABADO: Readonly<Record<FinishId, { tinta: string; op: number; luz: string; luzOp: number }>> = {
  acero: { tinta: "#2c3034", op: 0.8, luz: "#ffffff", luzOp: 0.6 },
  "oro-rosa": { tinta: "#4a2b1f", op: 0.78, luz: "#fff3ea", luzOp: 0.55 },
  "pvd-negro": { tinta: "#c4c7cb", op: 0.9, luz: "#000000", luzOp: 0.55 },
};

export function CasebackArt({ c, p }: { c: WatchConfig; p: string }) {
  const fin: FinishId = c.acabado in GRABADO ? c.acabado : "acero";
  const g = GRABADO[fin];
  const tinte = TAPA_TINTE[fin];
  const T = TAPA_FOTO;
  const side = T.size * T.k;
  // Las letras del grabado = las del archivo láser (curvas), en cuanto cargan.
  const outline = useOutline();
  const grab = (ink: string, pre: string) => {
    const prims = casebackPrimitives(c, { ink }).filter((x) => x.capa === "grabado");
    return primitivesToSvg(outline ? outline(prims) : prims, { idPrefix: pre, decimals: 3 });
  };
  // El grabado a escala real (1 mm = PX_POR_MM), centrado en el disco.
  const mm = `translate(${CX} ${CY}) scale(${PX_POR_MM})`;
  return (
    <>
      <defs>
        <clipPath id={`${p}-disco`}>
          <circle cx={CX} cy={CY} r={PLANTILLA.R_ESFERA} />
        </clipPath>
        {tinte && (
          <filter id={`${p}-tinte-${fin}`} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={tinte} />
          </filter>
        )}
        {/* Láser de fibra: marca escarchada (grano fino), no tinta lisa. */}
        <filter id={`${p}-escarcha`} filterUnits="userSpaceOnUse" {...DIAL_REGION} colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.25" result="a" />
          <feComposite in="SourceGraphic" in2="a" operator="in" />
        </filter>
        <radialGradient id={`${p}-tapa-vineta`} gradientUnits="userSpaceOnUse" cx={CX + 6} cy={CY + 9} r={R_VENTANA_PX + 4}>
          <stop offset="0.86" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.3" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${p}-disco)`}>
        <image
          href={tapaUrl(1024)}
          x={f(CX - T.cx * T.k)}
          y={f(CY - T.cy * T.k)}
          width={f(side)}
          height={f(side)}
          filter={tinte ? `url(#${p}-tinte-${fin})` : undefined}
          preserveAspectRatio="none"
        />
        <circle cx={CX} cy={CY} r={R_VENTANA_PX} fill={`url(#${p}-tapa-vineta)`} />
      </g>
      <g filter={`url(#${p}-escarcha)`}>
        <g transform="translate(0.8 1.1)" opacity={g.luzOp}>
          <g transform={mm} dangerouslySetInnerHTML={{ __html: grab(g.luz, `${p}-grl`) }} />
        </g>
        <g opacity={g.op}>
          <g transform={mm} dangerouslySetInnerHTML={{ __html: grab(g.tinta, `${p}-gr`) }} />
        </g>
      </g>
    </>
  );
}
