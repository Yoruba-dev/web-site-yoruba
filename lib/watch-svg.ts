// ---------------------------------------------------------------------------
// SVG DEL RELOJ — cartel, miniatura del carrito, hoja del taller y archivos de
// producción, todos como texto SVG (sin DOM: seguros en el servidor).
//
//   frontSvg(c)      el reloj de frente: cartel / póster y miniatura del carrito.
//   casebackSvg(c)   el reloj por detrás, con el grabado de la tapa.
//   laserSvg(c)      archivo láser 1:1 en mm: SOLO el grabado, sin espejo, 12 arriba.
//   dialPrintSvg(c)  archivo de impresión 1:1 en mm de la esfera: pista + texto +
//                    signo (sin las piezas aplicadas), con guías aparte.
//
// La esfera y la tapa salen de lib/watch-art.ts (las mismas primitivas en mm que
// pinta la vista 3D). Lo que se añade aquí es solo "atrezo" del cartel: caja,
// correa, agujas en handPose(c) (10:10:40; la Esfera Ifá, 10:09:39), el aplique
// PY y el brillo del cristal.
//
// El aplique PY es un marcador estilizado (máscara dorada con corona de
// cuentas): el logo vectorizado real lo sustituirá en appliqueMarkup().
//
// Para un <img>: svgDataUrl() — encodeURIComponent, nunca btoa (las tildes y el
// "·" no son Latin-1; ver lib/glyph-svg.ts).
// ---------------------------------------------------------------------------
import {
  CASEBACK_LAYOUT,
  DIAL_LAYOUT,
  HANDS,
  casebackPrimitives,
  dialHasDate,
  dialPrimitives,
  escapeXml,
  fmt,
  handAngles,
  handMetalHex,
  handPose,
  primitivesToSvg,
  toSvg,
  type Primitive,
  type RectPrim,
} from "./watch-art";
import {
  WATCH_COLORS,
  WATCH_MATERIALS,
  WATCH_SPECS,
  contrastRatio,
  designCode,
  dialColorAt,
  getAppliquePart,
  getDialBase,
  getFinish,
  getSecondsPart,
  getStrap,
  type FinishId,
  type WatchConfig,
} from "./watch";

/** Números del cartel con 2 decimales (10 µm): miniaturas más ligeras. */
const f = (n: number) => fmt(n, 2);

// ===========================================================================
// Tonos del cartel
// ===========================================================================
export interface Tones {
  base: string;
  light: string;
  dark: string;
  deep: string;
}

/** Tonos de cada acabado para dibujar el metal (cepillado / pulido / sombra). */
export const FINISH_TONES: Readonly<Record<FinishId, Tones>> = {
  acero: { base: WATCH_MATERIALS.acero, light: "#f1f3f5", dark: "#8e9297", deep: "#5f6368" },
  "pvd-negro": { base: WATCH_MATERIALS["pvd-negro"], light: "#64676f", dark: "#18191c", deep: "#0b0b0c" },
  "oro-rosa": { base: WATCH_MATERIALS["oro-rosa"], light: "#f8e2d6", dark: "#b8816a", deep: "#8a5a46" },
};

const APPLIQUE_TONES: Readonly<Record<"oro" | "plata", Tones>> = {
  oro: { base: WATCH_MATERIALS.oro, light: "#fde9b4", dark: "#b07f2a", deep: "#6e4b12" },
  plata: { base: WATCH_MATERIALS.plata, light: "#f6f7f9", dark: "#8d9298", deep: "#555a60" },
};

/** Mezcla `hex` con negro (t < 0) o blanco (t > 0). */
function shade(hex: string, t: number): string {
  const h = hex.replace("#", "");
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  const target = t < 0 ? 0 : 255;
  const k = Math.abs(t);
  return `#${c.map((v) => Math.round(v + (target - v) * k).toString(16).padStart(2, "0")).join("")}`;
}

// ===========================================================================
// Geometría del cartel (mm, origen en el centro de la esfera, y hacia abajo)
// ===========================================================================
/** Octágono de esquinas cortadas: la silueta del bisel. */
const BEZEL = { half: 19.6, cut: 8.2, round: 2.6 };
const VIEW = 30; // el lienzo va de -30 a 30 mm

/** Polígono con las esquinas redondeadas (radio r) como trazo SVG. */
function roundedPoly(pts: readonly [number, number][], r: number): string {
  let d = "";
  pts.forEach((p, i) => {
    const prev = pts[(i + pts.length - 1) % pts.length];
    const next = pts[(i + 1) % pts.length];
    const toward = (a: readonly [number, number], b: readonly [number, number], dist: number) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const k = Math.min(dist, len / 2) / len;
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    };
    const a = toward(p, prev, r);
    const b = toward(p, next, r);
    d += `${i === 0 ? "M" : "L"}${f(a[0])} ${f(a[1])}Q${f(p[0])} ${f(p[1])} ${f(b[0])} ${f(b[1])}`;
  });
  return `${d}Z`;
}

function octagon(half: number, cut: number): [number, number][] {
  return [
    [-half + cut, -half],
    [half - cut, -half],
    [half, -half + cut],
    [half, half - cut],
    [half - cut, half],
    [-half + cut, half],
    [-half, half - cut],
    [-half, -half + cut],
  ];
}

const BEZEL_PATH = roundedPoly(octagon(BEZEL.half, BEZEL.cut), BEZEL.round);
/** El cuerpo de la caja asoma un poco por fuera del bisel. */
const BODY_PATH = roundedPoly(octagon(BEZEL.half + 0.9, BEZEL.cut + 0.5), BEZEL.round + 0.6);

// ===========================================================================
// Piezas del cartel
// ===========================================================================
/** Gradientes que usan las piezas; `p` = prefijo de ids. */
function defs(p: string, metal: Tones, strapHex: string | null, app: Tones, dialHex: string): string {
  const lin = (id: string, x2: number, y2: number, stops: [number, string, number?][]) =>
    `<linearGradient id="${p}${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops
      .map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ""}/>`)
      .join("")}</linearGradient>`;
  const strap = strapHex ?? metal.base;
  return (
    `<defs>` +
    // Metal cepillado (bisel, caja): luz arriba a la izquierda.
    lin("brush", 1, 1, [[0, metal.light], [0.45, metal.base], [1, metal.dark]]) +
    // Metal pulido (chaflanes, terminales): bandas de luz marcadas.
    lin("polish", 0, 1, [[0, metal.deep], [0.35, metal.light], [0.55, metal.dark], [1, metal.light]]) +
    lin("polishR", 1, 1, [[0, metal.dark], [0.5, metal.light], [1, metal.deep]]) +
    // Correa: volumen de lado a lado.
    lin("strap", 1, 0, [[0, shade(strap, -0.35)], [0.18, strap], [0.5, shade(strap, 0.1)], [0.82, strap], [1, shade(strap, -0.35)]]) +
    lin("app", 1, 1, [[0, app.light], [0.5, app.base], [1, app.dark]]) +
    // Sol de la esfera: dos haces de luz opuestos (el "lazo" de un acabado sol).
    `<radialGradient id="${p}ray" cx="0" cy="0" r="15" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="0.34"/></radialGradient>` +
    `<radialGradient id="${p}shadow" cx="0" cy="0" r="15" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.26"/></radialGradient>` +
    `<radialGradient id="${p}vig" cx="0" cy="0" r="15" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0.7" stop-color="${dialHex}" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.22"/></radialGradient>` +
    `<clipPath id="${p}dial"><circle cx="0" cy="0" r="${DIAL_LAYOUT.visibleR}"/></clipPath>` +
    `<filter id="${p}soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.3"/></filter>` +
    `</defs>`
  );
}

/** Tramo de correa entre y0 (junto a la caja) e y1 (borde del lienzo). */
function strapMarkup(c: WatchConfig, p: string, y0: number, y1: number, tones: Tones, back = false): string {
  const s = getStrap(c.correa);
  const dir = Math.sign(y1 - y0);
  const w0 = 11.7;
  const w1 = 11.1;
  const outline = `M${-w0} ${y0}L${w0} ${y0}L${w1} ${y1}L${-w1} ${y1}Z`;
  if (s?.tipo === "brazalete") {
    // Eslabones de tres piezas: centro pulido, laterales cepillados.
    let links = "";
    const h = 3.1;
    for (let y = y0; dir > 0 ? y < y1 : y > y1; y += dir * (h + 0.25)) {
      const top = dir > 0 ? y : y - h;
      links +=
        `<rect x="${-w0}" y="${f(top)}" width="${f(w0 - 3.3)}" height="${h}" rx="0.5" fill="url(#${p}brush)" stroke="${tones.deep}" stroke-width="0.12"/>` +
        `<rect x="3.3" y="${f(top)}" width="${f(w0 - 3.3)}" height="${h}" rx="0.5" fill="url(#${p}brush)" stroke="${tones.deep}" stroke-width="0.12"/>` +
        `<rect x="-3.15" y="${f(top + 0.2)}" width="6.3" height="${f(h - 0.4)}" rx="0.6" fill="url(#${p}polish)" stroke="${tones.deep}" stroke-width="0.12"/>`;
    }
    return `<g clip-path="url(#${p}strapclip${y0 < 0 ? "t" : "b"})">${links}</g>` + clipDef(p, y0 < 0 ? "t" : "b", outline);
  }
  const hex = s?.color ? WATCH_COLORS[s.color].hex : tones.base;
  let detail = "";
  if (s?.tipo === "caucho" && !back) {
    // Nervaduras a lo largo (la correa real de las imágenes 1 y 7).
    for (let x = -9.6; x <= 9.61; x += 1.6) {
      detail += `<line x1="${f(x)}" y1="${f(y0 + dir * 0.6)}" x2="${f(x * (w1 / w0))}" y2="${f(y1)}" stroke="${shade(hex, -0.32)}" stroke-width="0.42" stroke-linecap="round"/>`;
    }
  } else if (s?.tipo === "piel") {
    // Costura a 1 mm del borde.
    const sx0 = w0 - 1.1;
    const sx1 = w1 - 1.1;
    detail +=
      `<path d="M${f(-sx0)} ${f(y0)}L${f(-sx1)} ${f(y1)}M${f(sx0)} ${f(y0)}L${f(sx1)} ${f(y1)}" stroke="${shade(hex, 0.45)}" stroke-width="0.22" stroke-dasharray="0.7 0.5" fill="none"/>`;
  }
  return `<path d="${outline}" fill="url(#${p}strap)"/>${detail}`;
}

function clipDef(p: string, k: string, d: string): string {
  return `<clipPath id="${p}strapclip${k}"><path d="${d}"/></clipPath>`;
}

/** Terminal pulido entre la caja y la correa. */
function endLink(p: string, y0: number, y1: number, tones: Tones): string {
  return `<path d="M-12.7 ${y0}L12.7 ${y0}L11.9 ${y1}L-11.9 ${y1}Z" fill="url(#${p}polish)" stroke="${tones.deep}" stroke-width="0.15"/>`;
}

/** Cuerpo de la caja, orejas laterales y corona (a las 3 de frente, a las 9
 *  vista por detrás). */
function caseBody(p: string, tones: Tones, crownSide: 1 | -1): string {
  const cx = crownSide * 20.4;
  let grooves = "";
  for (let i = 0; i < 7; i++) {
    const x = cx + crownSide * (0.7 + i * 0.42);
    grooves += `<line x1="${f(x)}" y1="-2.1" x2="${f(x)}" y2="2.1" stroke="${tones.deep}" stroke-width="0.12"/>`;
  }
  const crownX = crownSide > 0 ? 20.2 : -23.6;
  return (
    `<path d="${BODY_PATH}" fill="${tones.dark}"/>` +
    `<rect x="-21.2" y="-8" width="42.4" height="16" rx="1.8" fill="url(#${p}polishR)" stroke="${tones.deep}" stroke-width="0.15"/>` +
    `<rect x="${crownX}" y="-2.5" width="3.4" height="5" rx="0.7" fill="url(#${p}polish)" stroke="${tones.deep}" stroke-width="0.15"/>` +
    grooves
  );
}

/** Bisel octagonal: cepillado arriba, filo pulido y chaflán interior pulido. */
function bezel(p: string, tones: Tones): string {
  // Pestaña interior: el anillo de metal en sombra entre la ventana de la caja
  // (DIAL_LAYOUT.visibleR, 14.4) y el chaflán (15.15).
  const V = DIAL_LAYOUT.visibleR;
  const chamferIn = 15.15;
  return (
    `<path d="${BEZEL_PATH}" fill="url(#${p}brush)" stroke="${tones.light}" stroke-width="0.55"/>` +
    `<path d="${BEZEL_PATH}" fill="none" stroke="${tones.deep}" stroke-width="0.15" transform="scale(1.018)"/>` +
    `<circle cx="0" cy="0" r="${f((V + chamferIn) / 2)}" fill="none" stroke="${tones.dark}" stroke-width="${f(chamferIn - V)}"/>` +
    // Chaflán interior pulido (anillo entre la tapa cepillada y el cristal).
    `<circle cx="0" cy="0" r="15.9" fill="none" stroke="url(#${p}polishR)" stroke-width="1.5"/>` +
    `<circle cx="0" cy="0" r="16.65" fill="none" stroke="${tones.deep}" stroke-width="0.1" opacity="0.6"/>`
  );
}

/** El aplique PY (marcador): corona de cuentas + máscara con marcas en las
 *  mejillas + "PY". Caja de 5 × 6 mm con la esquina en (x, y). */
export function appliqueMarkup(slot: Pick<RectPrim, "x" | "y" | "w" | "h">, metal: "oro" | "plata", p: string): string {
  const t = APPLIQUE_TONES[metal];
  const k = slot.w / 5; // el dibujo está hecho para 5 × 6
  let beads = "";
  for (let i = 0; i < 6; i++) {
    beads += `<circle cx="${f(0.72 + i * 0.712)}" cy="0.5" r="0.24" fill="${t.light}" stroke="${t.deep}" stroke-width="0.06"/>`;
  }
  const cheeks = [2.55, 2.78, 3.01]
    .map((y) => `M0.98 ${y}L1.42 ${y}M3.58 ${y}L4.02 ${y}`)
    .join("");
  return (
    `<g transform="translate(${f(slot.x)} ${f(slot.y)}) scale(${f(k)})">` +
    // sombra
    `<path d="M0.55 1.15L4.75 1.15L4.62 2.75Q4.45 4.05 2.65 4.78Q0.85 4.05 0.68 2.75Z" fill="#000" opacity="0.22"/>` +
    // corona
    `<rect x="0.25" y="0" width="4.5" height="1" rx="0.12" fill="url(#${p}app)" stroke="${t.dark}" stroke-width="0.08"/>` +
    beads +
    // máscara
    `<path d="M0.45 1.05L4.55 1.05L4.43 2.62Q4.27 3.92 2.5 4.62Q0.73 3.92 0.57 2.62Z" fill="url(#${p}app)" stroke="${t.dark}" stroke-width="0.08"/>` +
    `<path d="M1.02 2.08Q1.56 1.72 2.1 2.08Q1.56 2.3 1.02 2.08ZM2.9 2.08Q3.44 1.72 3.98 2.08Q3.44 2.3 2.9 2.08Z" fill="${t.deep}"/>` +
    `<path d="M1.0 1.62Q1.55 1.4 2.12 1.62M2.88 1.62Q3.45 1.4 4.0 1.62" fill="none" stroke="${t.dark}" stroke-width="0.11"/>` +
    `<path d="M2.5 2.05L2.5 3.0Q2.32 3.2 2.12 3.12M1.88 3.6Q2.5 3.86 3.12 3.6" fill="none" stroke="${t.deep}" stroke-width="0.12" stroke-linecap="round"/>` +
    `<path d="${cheeks}" stroke="${t.dark}" stroke-width="0.1" stroke-linecap="round"/>` +
    // letras
    `<text x="2.5" y="5.95" font-family="Georgia, Times New Roman, serif" font-size="1.45" font-weight="700" letter-spacing="0.08" text-anchor="middle" fill="url(#${p}app)" stroke="${t.dark}" stroke-width="${metal === "plata" ? 0.07 : 0.04}">PY</text>` +
    `</g>`
  );
}

/** Agujas en handPose(c) (10:10:40; la Esfera Ifá, 10:09:39) con su sombra.
 *  Las medidas salen de HANDS, las mismas cifras con las que check-watch-data
 *  comprueba que el segundero no tapa el nombre, el aplique, el signo ni los
 *  Meyis. */
function hands(c: WatchConfig): string {
  const metal = handMetalHex(c);
  const edge = shade(metal, -0.45);
  const lume = WATCH_MATERIALS.lume;
  const secHex = WATCH_COLORS[getSecondsPart(c.segundero)?.color ?? "negro"].hex;
  const secEdge = shade(secHex, -0.35);
  const ang = handAngles(handPose(c));
  const S = HANDS.seconds;
  const neck = S.tip - S.head.len;
  const blade = (h: { tail: number; tip: number; shoulder: number; halfW: number }) =>
    `M${-h.halfW} ${h.tail}L${-h.halfW} ${-h.shoulder}L0 ${-h.tip}L${h.halfW} ${-h.shoulder}L${h.halfW} ${h.tail}Z`;
  const hour =
    `<path d="${blade(HANDS.hour)}" fill="${metal}" stroke="${edge}" stroke-width="0.09"/>` +
    `<path d="M-0.44 -1.7L-0.44 -6.35L0 -7.3L0.44 -6.35L0.44 -1.7Z" fill="${lume}"/>`;
  const minute =
    `<path d="${blade(HANDS.minute)}" fill="${metal}" stroke="${edge}" stroke-width="0.09"/>` +
    `<path d="M-0.32 -2L-0.32 -11.15L0 -11.95L0.32 -11.15L0.32 -2Z" fill="${lume}"/>`;
  const second =
    `<path d="M${-S.halfW} ${S.tail}L${-S.halfW} ${f(-neck)}L${-S.head.halfW} ${f(-neck)}L0 ${-S.tip}` +
    `L${S.head.halfW} ${f(-neck)}L${S.halfW} ${f(-neck)}L${S.halfW} ${S.tail}Z" fill="${secHex}" stroke="${secEdge}" stroke-width="0.04"/>` +
    `<circle cx="0" cy="${-S.lume.at}" r="${S.lume.r}" fill="${lume}" stroke="${secHex}" stroke-width="${S.lume.ring}"/>` +
    `<circle cx="0" cy="${S.counter.at}" r="${S.counter.r}" fill="${secHex}" stroke="${secEdge}" stroke-width="0.05"/>`;
  const rot = (deg: number, inner: string) => `<g transform="rotate(${f(deg)})">${inner}</g>`;
  const set = rot(ang.hour, hour) + rot(ang.minute, minute) + rot(ang.seconds, second);
  // Sombra: las mismas agujas, desplazadas y en negro translúcido.
  const shadow = set.replace(/(fill|stroke)="[^"]+"/g, '$1="#000"');
  return (
    `<g transform="translate(0.28 0.4)" opacity="0.28">${shadow}</g>` +
    set +
    `<circle cx="0" cy="0" r="1.15" fill="${metal}" stroke="${edge}" stroke-width="0.08"/>` +
    `<circle cx="0" cy="0" r="0.62" fill="${secHex}"/>` +
    `<circle cx="0" cy="0" r="0.2" fill="${metal}"/>`
  );
}

/** El sol de la esfera: dos haces claros y dos oscuros, cruzados y difuminados.
 *  Sobre una esfera clara solo se notan los oscuros, más suaves. */
function sunray(p: string, light: boolean): string {
  const wedge = (deg: number, half: number) => {
    const a = ((deg - half) * Math.PI) / 180;
    const b = ((deg + half) * Math.PI) / 180;
    const R = 16;
    return `M0 0L${f(R * Math.sin(a))} ${f(-R * Math.cos(a))}A${R} ${R} 0 0 1 ${f(R * Math.sin(b))} ${f(-R * Math.cos(b))}Z`;
  };
  return (
    `<g filter="url(#${p}soft)">` +
    (light ? "" : `<path d="${wedge(315, 26)}${wedge(135, 26)}" fill="url(#${p}ray)"/>`) +
    `<path d="${wedge(45, 30)}${wedge(225, 30)}" fill="url(#${p}shadow)" opacity="${light ? 0.45 : 1}"/>` +
    `</g>`
  );
}

// ===========================================================================
// Builders públicos
// ===========================================================================
export interface PosterOptions {
  /** Ancho y alto en px del SVG (el lienzo es cuadrado). Por defecto 600. */
  size?: number;
  /** Color de fondo; sin él, transparente. */
  fondo?: string;
  /** Prefijo de ids (varios SVG del reloj en una misma página). */
  idPrefix?: string;
  /** Texto → contornos de imprenta (lib/watch-curvas.ts outlinePrimitives).
   *  Un SVG dentro de <img> no puede usar las fuentes de la página: con esto
   *  las letras salen iguales que en la esfera impresa. */
  curvas?: (prims: readonly Primitive[]) => Primitive[];
}

/** El reloj de frente: caja octogonal en su acabado, esfera (de las primitivas
 *  en mm), aplique PY, agujas en handPose(c) y correa arriba y abajo. */
export function frontSvg(c: WatchConfig, opts: PosterOptions = {}): string {
  const p = opts.idPrefix ?? "pyw";
  const size = opts.size ?? 600;
  const tones = FINISH_TONES[getFinish(c.acabado)?.id ?? "acero"];
  const strap = getStrap(c.correa);
  const strapHex = strap?.color ? WATCH_COLORS[strap.color].hex : null;
  const metal = getAppliquePart(c.aplique)?.metal ?? "oro";
  const dial = dialPrimitives(c);
  const dialHex = dial.find((q) => q.id === "esfera")?.fill ?? "#ffffff";
  // Un degradado: el disco se pinta con el MISMO degradado (dialColorAt).
  const grad = getDialBase(c.esfera.base)?.degradado;
  const R = WATCH_SPECS.dialMm / 2;
  const gradDefs = grad
    ? `<defs><linearGradient id="${p}grad" gradientUnits="userSpaceOnUse" x1="0" y1="${-R}" x2="0" y2="${R}">` +
      Array.from({ length: 9 }, (_, i) => `<stop offset="${i / 8}" stop-color="${dialColorAt(c.esfera, -R + (2 * R * i) / 8)}"/>`).join("") +
      `</linearGradient></defs>`
    : "";
  const conDisco = grad ? dial.map((q) => (q.id === "esfera" ? { ...q, fill: `url(#${p}grad)` } : q)) : dial;
  const prims = opts.curvas ? opts.curvas(conDisco) : conDisco;
  const slot = prims.find((q): q is RectPrim => q.kind === "rect" && q.id === "aplique");
  const D = DIAL_LAYOUT.date;
  const bg = opts.fondo ? `<rect x="${-VIEW}" y="${-VIEW}" width="${2 * VIEW}" height="${2 * VIEW}" fill="${opts.fondo}"/>` : "";

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${-VIEW} ${-VIEW} ${2 * VIEW} ${2 * VIEW}">` +
    `<title>Reloj ${escapeXml(designCode(c))}</title>` +
    defs(p, tones, strapHex, APPLIQUE_TONES[metal], dialHex) +
    gradDefs +
    bg +
    strapMarkup(c, p, -21.6, -VIEW, tones) +
    strapMarkup(c, p, 21.6, VIEW, tones) +
    endLink(p, -18.5, -22.1, tones) +
    endLink(p, 18.5, 22.1, tones) +
    caseBody(p, tones, 1) +
    bezel(p, tones) +
    // La esfera, recortada por la pestaña de la caja.
    `<g clip-path="url(#${p}dial)">` +
    primitivesToSvg(prims, { idPrefix: p, decimals: 2 }) +
    sunray(p, contrastRatio(dialHex, "#000000") > 10) +
    `<circle cx="0" cy="0" r="15" fill="url(#${p}vig)"/>` +
    `</g>` +
    `<circle cx="0" cy="0" r="${DIAL_LAYOUT.visibleR}" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="0.35"/>` +
    (slot ? appliqueMarkup(slot, metal, p) : "") +
    // El número del disco de fecha (8, como en las fotos de catálogo).
    (dialHasDate(c)
      ? `<text x="${f(D.cx)}" y="0.62" font-family="Helvetica, Arial, sans-serif" font-size="1.7" font-weight="700" text-anchor="middle" fill="#151515">8</text>`
      : "") +
    hands(c) +
    // Brillo del cristal.
    `<path d="M-13.2 -6.2A14.4 14.4 0 0 1 -2.4 -14.2A15.6 15.6 0 0 0 -13.2 -6.2Z" fill="#fff" opacity="0.16"/>` +
    `</svg>`
  );
}

/** El reloj por detrás: la tapa roscada con el grabado (sin espejo, 12 arriba;
 *  la corona queda a las 9 porque se mira desde atrás). */
export function casebackSvg(c: WatchConfig, opts: PosterOptions = {}): string {
  const p = opts.idPrefix ?? "pyb";
  const size = opts.size ?? 600;
  const tones = FINISH_TONES[getFinish(c.acabado)?.id ?? "acero"];
  const strap = getStrap(c.correa);
  const strapHex = strap?.color ? WATCH_COLORS[strap.color].hex : null;
  // Lo grabado: el acero oscurecido por el láser de fibra.
  const engraved = shade(tones.base, c.acabado === "pvd-negro" ? 0.55 : -0.55);
  const grabado = casebackPrimitives(c, { ink: engraved }).filter((q) => q.capa !== "guia");
  const prims = opts.curvas ? opts.curvas(grabado) : grabado;
  let notches = "";
  for (let i = 0; i < 6; i++) {
    notches += `<rect x="-0.9" y="-16.75" width="1.8" height="1.1" rx="0.2" fill="${tones.deep}" transform="rotate(${i * 60 + 30})"/>`;
  }
  const bg = opts.fondo ? `<rect x="${-VIEW}" y="${-VIEW}" width="${2 * VIEW}" height="${2 * VIEW}" fill="${opts.fondo}"/>` : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${-VIEW} ${-VIEW} ${2 * VIEW} ${2 * VIEW}">` +
    `<title>Tapa del reloj ${escapeXml(designCode(c))}</title>` +
    defs(p, tones, strapHex, APPLIQUE_TONES.plata, "#000000") +
    bg +
    strapMarkup(c, p, -21.6, -VIEW, tones, true) +
    strapMarkup(c, p, 21.6, VIEW, tones, true) +
    endLink(p, -18.5, -22.1, tones) +
    endLink(p, 18.5, 22.1, tones) +
    caseBody(p, tones, -1) +
    `<path d="${BEZEL_PATH}" fill="url(#${p}brush)" stroke="${tones.deep}" stroke-width="0.2"/>` +
    // Tapa roscada: filo pulido, muescas de la llave, disco cepillado y campo.
    `<circle cx="0" cy="0" r="17" fill="url(#${p}polishR)" stroke="${tones.deep}" stroke-width="0.15"/>` +
    notches +
    `<circle cx="0" cy="0" r="15.6" fill="url(#${p}brush)" stroke="${tones.deep}" stroke-width="0.12"/>` +
    `<circle cx="0" cy="0" r="12.25" fill="${shade(tones.base, 0.12)}" stroke="${tones.dark}" stroke-width="0.12"/>` +
    primitivesToSvg(prims, { idPrefix: p, decimals: 2 }) +
    `</svg>`
  );
}

/** Opciones de los archivos de producción. `curvas` convierte el texto a
 *  trazos (lib/watch-curvas.ts → outlinePrimitives): se pasa desde fuera para
 *  que la tabla de contornos (~116 KB) no entre en este módulo, que también
 *  usa el navegador (miniatura del carrito). */
export interface ProductionSvgOptions {
  curvas?: (prims: readonly Primitive[]) => Primitive[];
}

/** Archivo láser de la tapa, 1:1 en mm (24 × 24, centro = centro de la tapa):
 *  SOLO el grabado, en negro, SIN espejo y con las 12 arriba. Sin `curvas`, el
 *  texto va como <text> con la pila de fuentes; la hoja del taller y las
 *  descargas usan laserSvgCurvas() (lib/watch-curvas.ts): texto en trazos. */
export function laserSvg(c: WatchConfig, opts: ProductionSvgOptions = {}): string {
  const R = CASEBACK_LAYOUT.fieldR;
  const grabado = casebackPrimitives(c, { ink: "#000000" }).filter((q) => q.capa === "grabado");
  const prims = opts.curvas ? opts.curvas(grabado) : grabado;
  return toSvg(prims, {
    viewBox: [-R, -R, 2 * R, 2 * R],
    mirror: false,
    idPrefix: "laser",
    title: `Tapa ${designCode(c)} · campo Ø${2 * R} mm · vista trasera · sin espejo · 12 arriba${opts.curvas ? " · texto en curvas" : ""}`,
  });
}

/** Archivo de impresión de la esfera, 1:1 en mm (Ø30.5, centro = centro de la
 *  esfera, 12 arriba): pista + texto + signo. Las piezas aplicadas (índices,
 *  marco de fecha, aplique) NO van. Las guías (contorno del disco, agujero
 *  central, hueco de la fecha, zona del aplique) van en un grupo aparte
 *  "guias-no-imprimir", en cian y de 0.05 mm. */
export function dialPrintSvg(c: WatchConfig, opts: ProductionSvgOptions = {}): string {
  const L = DIAL_LAYOUT;
  const all = dialPrimitives(c);
  const impresion = all.filter((q) => q.capa === "impresion");
  const print = opts.curvas ? opts.curvas(impresion) : impresion;
  const win = all.find((q): q is RectPrim => q.kind === "rect" && q.id === "ventana-fecha");
  const app = all.find((q): q is RectPrim => q.kind === "rect" && q.id === "aplique");
  const guide = (q: Primitive): Primitive => ({ ...q, capa: "guia", fill: "none", stroke: "#00a0e0", strokeWidth: 0.05 });
  const guides: Primitive[] = [
    { kind: "circle", id: "esfera", capa: "guia", cx: 0, cy: 0, r: L.r, fill: "none", stroke: "#00a0e0", strokeWidth: 0.05 },
    { kind: "circle", capa: "guia", cx: 0, cy: 0, r: 1.025, fill: "none", stroke: "#00a0e0", strokeWidth: 0.05 },
    ...(win ? [guide({ ...win, id: undefined })] : []),
    ...(app ? [guide({ ...app, id: undefined })] : []),
  ];
  const [x, y, w] = [-L.r, -L.r, 2 * L.r];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}mm" height="${f(w)}mm" viewBox="${f(x)} ${f(y)} ${f(w)} ${f(w)}">` +
    `<title>Esfera ${escapeXml(designCode(c))} · Ø${f(w)} mm · impresión 1:1 · 12 arriba${opts.curvas ? " · texto en curvas" : ""}</title>` +
    `<g id="guias-no-imprimir">${primitivesToSvg(guides, { idPrefix: "guia" })}</g>` +
    `<g id="impresion">${primitivesToSvg(print, { idPrefix: "imp" })}</g>` +
    `</svg>`
  );
}

/** SVG → data URL para un <img> (encodeURIComponent: UTF-8 correcto, y sirve
 *  en el servidor). */
export function svgDataUrl(svg: string): string {
  // Comillas dobles → simples: encodeURIComponent no codifica ' y la URL sale
  // bastante más corta. Es seguro porque ningún valor de atributo lleva '
  // (las pilas de fuentes van sin comillas) y el texto va escapado (&apos;).
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/"/g, "'"))}`;
}

/** La miniatura del carrito: frontSvg pequeño como data URL. */
export function frontSvgDataUrl(c: WatchConfig, opts: PosterOptions = {}): string {
  return svgDataUrl(frontSvg(c, { size: 240, ...opts }));
}
