// ---------------------------------------------------------------------------
// ARTE DEL RELOJ EN MILÍMETROS — una sola geometría para todas las salidas.
//
// dialPrimitives() y casebackPrimitives() describen la esfera y la tapa como
// una lista de primitivas (círculo, rectángulo, trazo, texto, texto en arco) en
// MILÍMETROS REALES, con el origen en el centro y el eje y HACIA ABAJO (como
// SVG y canvas). De esa lista salen, sin reinterpretar nada:
//   • el SVG del cartel, la miniatura del carrito y la hoja del taller
//     (lib/watch-svg.ts, vía toSvg / primitivesToSvg);
//   • el archivo de impresión de la esfera y el archivo láser de la tapa;
//   • las texturas canvas de la vista 3D (pintan las mismas primitivas).
// Así las letras, las tildes y las marcas del Odù son idénticas en todas partes.
//
// Reglas que no se negocian:
//   • El signo Odù se dibuja SIEMPRE derecho respecto a las 12 y nunca en
//     espejo (12 de los 16 Meyi se convierten en otro signo si se invierten).
//     Sus marcas salen de oduMarks() (lib/odu.ts), la geometría compartida.
//   • La tapa se describe tal como se ve mirándola por detrás, con las 12
//     arriba: es exactamente el archivo láser. No hay opción de espejo.
//
// Puro: sin DOM, sin React, sin three; seguro en el servidor.
// ---------------------------------------------------------------------------
import {
  ODU_GLYPH,
  oduLibretaMarks,
  oduMarks,
  oduSignBoxes,
  type Mark,
  type OduBox,
} from "./odu";
import {
  DIAL_BASES,
  TRACK_SEQUENCES,
  WATCH_COLORS,
  WATCH_MATERIALS,
  WATCH_SPECS,
  beadAt,
  contrastRatio,
  dialInk,
  getDialBase,
  getFinish,
  signColumns,
  signName,
  type OduSign,
  type WatchConfig,
} from "./watch";

/** mm → texto SVG con 3 decimales (una micra). */
const f = (n: number) => fmt(n);

// ===========================================================================
// PRIMITIVAS
// ===========================================================================
/** Fuentes de la esfera y la tapa. 'py-dial' = clásica (Cinzel), 'py-dial-fina'
 *  = fina (Cormorant). Las pilas de respaldo están en FONT_STACKS. */
export type DialFont = "py-dial" | "py-dial-fina";

/** Para qué sirve cada primitiva — los archivos de producción filtran por capa:
 *  'base'      el disco de la esfera (color del proveedor, no se imprime);
 *  'impresion' lo que imprime el taller en la esfera (pista, texto, signo);
 *  'aplicado'  piezas montadas (índices, aros, marco de fecha, aplique PY);
 *  'ventana'   la ventana de fecha (en 3D es un hueco con el disco debajo);
 *  'grabado'   lo que graba el láser en la tapa;
 *  'guia'      líneas de referencia que NO se imprimen ni se graban. */
export type Capa = "base" | "impresion" | "aplicado" | "ventana" | "grabado" | "guia";

interface PrimBase {
  /** Solo las primitivas con nombre propio: 'esfera', 'ventana-fecha',
   *  'aplique' (hueco donde va el logo PY), 'campo' (campo de la tapa). */
  id?: string;
  capa: Capa;
  /** Hex o 'none'. */
  fill?: string;
  stroke?: string;
  /** mm */
  strokeWidth?: number;
  strokeLinejoin?: "round" | "miter";
}

export interface CirclePrim extends PrimBase {
  kind: "circle";
  cx: number;
  cy: number;
  r: number;
}

export interface RectPrim extends PrimBase {
  kind: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
  rx?: number;
  /** Giro en grados (horario) alrededor del centro del rectángulo. */
  rotate?: number;
}

export interface PathPrim extends PrimBase {
  kind: "path";
  /** Datos de trazo SVG en mm. */
  d: string;
  fillRule?: "nonzero" | "evenodd";
}

/** Una línea de texto. (x, y) es el punto de la LÍNEA BASE; `anchor` dice qué
 *  parte del texto cae en x. `size` = tamaño de fuente (em) en mm. */
export interface TextRun extends PrimBase {
  kind: "text";
  text: string;
  x: number;
  y: number;
  font: DialFont;
  size: number;
  anchor: "start" | "middle" | "end";
  /** Espacio extra entre letras, en mm. */
  letterSpacing: number;
  weight?: number;
  /** Ancho máximo en mm: el tamaño ya viene ajustado con la estimación de
   *  estimateTextWidth(); el renderer puede además comprimir hasta este ancho
   *  (canvas: fillText(…, maxWidth); SVG: textLength). */
  maxWidth?: number;
}

/** Texto alrededor de un círculo, leyendo en sentido horario con la parte de
 *  arriba de las letras hacia fuera. `r` = radio de la línea base; el centro
 *  del texto cae en `centerDeg` (0 = las 12, horario) y ocupa `spanDeg`. */
export interface ArcText extends PrimBase {
  kind: "arcText";
  text: string;
  cx: number;
  cy: number;
  r: number;
  centerDeg: number;
  spanDeg: number;
  font: DialFont;
  size: number;
  weight?: number;
}

export type Primitive = CirclePrim | RectPrim | PathPrim | TextRun | ArcText;

/** Pilas de fuentes para SVG. Una <img> SVG no puede cargar fuentes web, así que
 *  fuera de la página cae en Georgia/serif; la vista 3D carga "PY Dial". */
export const FONT_STACKS: Readonly<Record<DialFont, string>> = {
  // Sin comillas a propósito (nombres de varias palabras son válidos sin ellas):
  // así el SVG puede ir en un data URL con comillas simples (ver svgDataUrl).
  "py-dial": "PY Dial, Cinzel, Trajan Pro, Georgia, Times New Roman, serif",
  "py-dial-fina": "PY Dial Fina, Cormorant Garamond, Cormorant, Georgia, Times New Roman, serif",
};

// ===========================================================================
// MEDIDA DE TEXTO (estimada, sin fuentes cargadas: sirve en el servidor)
// ===========================================================================
// Avance aproximado de cada mayúscula en Cinzel, en em. Las tildes no cambian
// el ancho; las minúsculas de Cinzel son versalitas (~85 %); Cormorant es más
// estrecha (~82 %). Errar un poco hacia ancho es lo seguro: el texto encoge.
const ADV: Record<string, number> = {
  A: 0.72, B: 0.64, C: 0.7, D: 0.76, E: 0.6, F: 0.56, G: 0.76, H: 0.8, I: 0.34, J: 0.36,
  K: 0.7, L: 0.56, M: 0.92, N: 0.78, O: 0.8, P: 0.6, Q: 0.8, R: 0.68, S: 0.56, T: 0.64,
  U: 0.76, V: 0.7, W: 1.0, X: 0.7, Y: 0.64, Z: 0.64, " ": 0.26, ".": 0.24, ",": 0.24,
  "·": 0.26, "'": 0.22, "-": 0.36, "&": 0.76, "/": 0.4,
};

export function estimateTextWidth(text: string, font: DialFont, size: number, letterSpacing = 0): number {
  let em = 0;
  for (const ch of text.normalize("NFD").replace(/[̀-ͯ]/g, "")) {
    const up = ch.toUpperCase();
    const a = ADV[up] ?? (/[0-9]/.test(ch) ? 0.6 : 0.7);
    em += ch !== up ? a * 0.85 : a;
  }
  if (font === "py-dial-fina") em *= 0.82;
  return em * size + letterSpacing * Math.max(0, [...text].length - 1);
}

/** El tamaño (mm) que hace caber `text` en `maxWidth`, sin pasar de `size`. El
 *  espaciado crece con el tamaño (`trackEm` em). */
export function fitTextSize(text: string, font: DialFont, size: number, maxWidth: number, trackEm = 0): number {
  const w = estimateTextWidth(text, font, size, size * trackEm);
  return w > maxWidth ? (size * maxWidth) / w : size;
}

// ===========================================================================
// ESFERA — medidas en mm (marcadores de posición hasta la Fase 0). La 3D lee
// las mismas cifras de aquí.
// ===========================================================================
export const DIAL_LAYOUT = {
  /** Radio del disco (Ø30.5). */
  r: WATCH_SPECS.dialMm / 2,
  /** Lo que deja ver la pestaña de la caja (para el cartel). */
  visibleR: 14.95,
  track: {
    /** Centro de las cuentas. */
    r: 14.05,
    beadR: 0.42,
    /** La cuenta de acento (Oyá) es más grande, para que la raya se vea. */
    accentScale: 1.35,
    /** Borde exterior de las rayas. */
    outerR: 14.6,
    minor: { len: 0.75, w: 0.17 },
    major: { len: 1.3, w: 0.36 },
  },
  /** Puntos luminosos aplicados a las 1, 2, 4, 5, 7, 8, 10, 11. */
  dots: { r: 11.6, dotR: 1.0, rimW: 0.2 },
  /** Triángulo invertido a las 12 (radios del borde de arriba y de la punta). */
  triangle: { outerR: 13.05, tipR: 10.25, halfW: 1.4, rimW: 0.2 },
  /** Barras a las 6 y a las 9 (centro, largo radial, ancho). */
  bar: { r: 11.4, len: 2.9, w: 1.15, rimW: 0.2 },
  /** Ventana de fecha a las 3 (WATCH_SPECS) y su marco. */
  date: { cx: WATCH_SPECS.dateWindow.centerMm, w: WATCH_SPECS.dateWindow.wMm, h: WATCH_SPECS.dateWindow.hMm, rim: 0.24 },
  /** Hueco del aplique PY (6 mm de alto bajo las 12, plano del proveedor). */
  applique: { cx: 0, cy: -5.6, w: 5.0, h: WATCH_SPECS.appliqueMm },
  /** Texto sobre las 6: línea base, tamaño, espaciado (em) y ancho máximo. */
  name: { baseline: 7.6, size: 1.55, trackEm: 0.09, maxW: 12.5, weight: 600 },
  /** Signo Odù: centro y alto de la TINTA (de la primera a la última fila).
   *  'seis' es lo más grande que cabe entre el eje (1.95) y la tilde del nombre
   *  (≈ 6.05) con 0.3 mm de aire: 3.8 mm → barras de 0.21 mm (requiere la
   *  prueba física del taller). check-watch-data mide ambas posiciones. */
  sign: {
    nueve: { cx: -6.3, cy: 0, inkH: 4.0 },
    seis: { cx: 0, cy: 3.85, inkH: 3.8 },
  },
  /** Franjas horizontales (solo con FLAGS.STRIPE_DIALS): paso y ancho de la
   *  franja clara, y cuánto se aclara sobre el color base. */
  stripes: { pitch: 1.0, band: 0.5, lighten: 0.07 },
} as const;

/** Las agujas en mm, dibujadas apuntando a las 12 desde el eje (y hacia abajo =
 *  la cola). Una sola fuente para el cartel, la miniatura y la vista 3D. */
export const HANDS = {
  /** La hora del cartel y de la cámara 3D: 10:10:40. A las :35 de spec.json
   *  el segundero cruzaba el nombre de las 6 y su contrapeso rozaba la "Y" del
   *  aplique; a las :40 cae sobre el punto de las 8 (como el de las 7 en el
   *  render 13 del dueño) y no toca el nombre, el aplique, el signo ni la
   *  fecha: scripts/check-watch-data.ts lo mide. */
  pose: { h: 10, m: 10, s: 40 },
  seconds: {
    /** Punta, desde el eje. */
    tip: 13.95,
    /** Cola, al otro lado del eje. */
    tail: 2.6,
    halfW: 0.09,
    /** La flecha de la punta. */
    head: { len: 1.35, halfW: 0.32 },
    /** Punto luminoso con aro del color del segundero (grosor `ring`). */
    lume: { at: 9.5, r: 0.74, ring: 0.26 },
    /** Contrapeso, en la cola. */
    counter: { at: 1.95, r: 0.74 },
  },
} as const;

/** Ángulos (grados, horario, 0 = las 12) de las tres agujas para una hora. */
export function handAngles(pose: { h: number; m: number; s: number } = HANDS.pose): {
  hour: number;
  minute: number;
  seconds: number;
} {
  const m = pose.m + pose.s / 60;
  return { hour: ((pose.h % 12) + m / 60) * 30, minute: m * 6, seconds: pose.s * 6 };
}

const HOURS_WITH_DOTS = [1, 2, 4, 5, 7, 8, 10, 11] as const;

/** `hex` mezclado con blanco en la proporción `t` (0–1). */
function lighten(hex: string, t: number): string {
  const h = hex.replace("#", "");
  return `#${[0, 2, 4]
    .map((i) => parseInt(h.slice(i, i + 2), 16))
    .map((v) => Math.round(v + (255 - v) * t).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Punto en el radio `r` y el ángulo `deg` (0 = las 12, horario). */
export function polar(r: number, deg: number): { x: number; y: number } {
  const a = (deg * Math.PI) / 180;
  return { x: r * Math.sin(a), y: -r * Math.cos(a) };
}

/** Metal de las agujas (sigue al acabado cuando haya un juego verificado; hoy
 *  siempre acero — FinishPart.metalAgujas). */
export function handMetalHex(c: WatchConfig): string {
  const fin = getFinish(c.acabado);
  return fin?.metalAgujas === "oro-rosa" ? WATCH_MATERIALS["oro-rosa"] : WATCH_MATERIALS["acero-pulido"];
}

/** Metal de los aros de los índices y del marco de la fecha, tal como se ve
 *  sobre la esfera (mismo metal que las agujas). */
export function rimMetalHex(c: WatchConfig): string {
  const fin = getFinish(c.acabado);
  return fin?.metalAgujas === "oro-rosa" ? WATCH_MATERIALS["oro-rosa-aro"] : WATCH_MATERIALS["acero-aro"];
}

/** Las marcas de un signo completo con la TINTA centrada en (cx, cy) y `inkH`
 *  de alto. Siempre derecho: solo escala y traslada (nunca gira ni refleja). */
export function signPrimitives(
  sign: OduSign,
  cx: number,
  cy: number,
  inkH: number,
  fill: string,
  capa: Capa,
  notation: "barras" | "libreta" = "barras",
): Primitive[] {
  const cols = signColumns(sign);
  if (!cols) return [];
  const g = ODU_GLYPH;
  const u = inkH / (g.inkBottom - g.inkTop);
  // La caja del tablero (100 × 106) cuyo centro coincide con el de la tinta.
  const box: OduBox = { x: cx - (g.signW / 2) * u, y: cy - (g.colH / 2) * u, w: g.signW * u, h: g.colH * u };
  const cells = oduSignBoxes(box);
  const out: Primitive[] = [];
  const column = (marks: readonly Mark[], cell: OduBox) => {
    if (notation === "barras") {
      for (const r of oduMarks(marks, cell)) out.push({ kind: "rect", capa, x: r.x, y: r.y, w: r.w, h: r.h, rx: r.rx, fill });
      return;
    }
    for (const m of oduLibretaMarks(marks, cell)) {
      if (m.kind === "barra") {
        out.push({ kind: "rect", capa, x: m.x, y: m.y, w: m.w, h: m.h, rx: m.rx, fill });
      } else {
        out.push({ kind: "path", capa, d: ringPath(m.cx, m.cy, m.rx, m.ry, m.t), fill, fillRule: "evenodd" });
      }
    }
  };
  column(cols.left, cells.left);
  column(cols.right, cells.right);
  return out;
}

/** Elipse hueca (un "0") como trazo par-impar: se rellena, no se contornea. */
function ringPath(cx: number, cy: number, rx: number, ry: number, t: number): string {
  const e = (a: number, b: number) =>
    `M${f(cx - a)} ${f(cy)}a${f(a)} ${f(b)} 0 1 0 ${f(2 * a)} 0a${f(a)} ${f(b)} 0 1 0 ${f(-2 * a)} 0Z`;
  return e(rx, ry) + e(rx - t, ry - t);
}

/** Todo lo que lleva la esfera, de abajo arriba: disco, pista, texto, signo,
 *  ventana de fecha y piezas aplicadas (con el hueco 'aplique' para el logo). */
export function dialPrimitives(c: WatchConfig): Primitive[] {
  const L = DIAL_LAYOUT;
  const base = getDialBase(c.esfera.base) ?? DIAL_BASES[0];
  const baseHex = WATCH_COLORS[base.color].hex;
  const ink = dialInk(base.id).hex;
  const rim = rimMetalHex(c);
  const lume = WATCH_MATERIALS.lume;
  const out: Primitive[] = [];

  // 1 · El disco (y su textura de proveedor, si es de franjas: no se imprime).
  out.push({ kind: "circle", id: "esfera", capa: "base", cx: 0, cy: 0, r: L.r, fill: baseHex });
  if (base.textura === "franjas") {
    const S = L.stripes;
    const light = lighten(baseHex, S.lighten);
    for (let y0 = -L.r + (S.pitch - S.band) / 2; y0 + S.band <= L.r; y0 += S.pitch) {
      // Cuerda del borde más alejado del centro: la franja nunca sale del disco.
      const far = Math.max(Math.abs(y0), Math.abs(y0 + S.band));
      const half = Math.sqrt(Math.max(0, L.r ** 2 - far ** 2));
      if (half > 0.2) out.push({ kind: "rect", capa: "base", x: -half, y: y0, w: 2 * half, h: S.band, fill: light });
    }
  }

  // 2 · La pista de minutos (60 posiciones; 0 = las 12).
  const { estilo, orisha } = c.esfera.pista;
  const seq = orisha ? TRACK_SEQUENCES[orisha] : undefined;
  // Un color que casi desaparece sobre la esfera lleva un filo de tinta (cuentas)
  // o se imprime en tinta (rayas): blanco sobre blanco, rojo sobre rojo…
  const lowContrast = (hex: string) => contrastRatio(hex, baseHex) < 1.6;
  for (let i = 0; i < 60; i++) {
    const deg = i * 6;
    if (estilo === "cuentas" && seq) {
      const b = beadAt(seq, i);
      const hex = WATCH_COLORS[b.color].hex;
      const r = L.track.beadR * (b.acento ? L.track.accentScale : 1);
      const p = polar(L.track.r, deg);
      out.push({
        kind: "circle",
        capa: "impresion",
        cx: p.x,
        cy: p.y,
        r,
        fill: hex,
        ...(lowContrast(hex) ? { stroke: ink, strokeWidth: 0.07 } : {}),
      });
      if (b.raya) {
        // La cuenta rayada: una banda a lo ancho, tangente a la pista.
        out.push({
          kind: "rect",
          capa: "impresion",
          x: p.x - r * 0.95,
          y: p.y - 0.09,
          w: r * 1.9,
          h: 0.18,
          rotate: deg,
          fill: WATCH_COLORS[b.raya].hex,
        });
      }
    } else {
      const major = i % 5 === 0;
      const t = major ? L.track.major : L.track.minor;
      const want = seq ? WATCH_COLORS[beadAt(seq, i).color].hex : ink;
      const hex = lowContrast(want) ? ink : want;
      const p = polar(L.track.outerR - t.len / 2, deg);
      out.push({ kind: "rect", capa: "impresion", x: p.x - t.w / 2, y: p.y - t.len / 2, w: t.w, h: t.len, rotate: deg, fill: hex });
    }
  }

  // 3 · El texto sobre las 6.
  const texto = c.esfera.texto.trim();
  if (texto) {
    const size = fitTextSize(texto, "py-dial", L.name.size, L.name.maxW, L.name.trackEm);
    out.push({
      kind: "text",
      capa: "impresion",
      text: texto,
      x: 0,
      y: L.name.baseline,
      font: "py-dial",
      size,
      anchor: "middle",
      letterSpacing: size * L.name.trackEm,
      weight: L.name.weight,
      maxWidth: L.name.maxW,
      fill: ink,
    });
  }

  // 4 · El signo Odù (derecho, nunca girado ni reflejado).
  if (c.esfera.signo) {
    const s = L.sign[c.esfera.signoPos];
    out.push(...signPrimitives(c.esfera.signo, s.cx, s.cy, s.inkH, ink, "impresion"));
  }

  // 5 · Ventana de fecha (el disco blanco se ve a través del hueco).
  const D = L.date;
  out.push({
    kind: "rect",
    id: "ventana-fecha",
    capa: "ventana",
    x: D.cx - D.w / 2,
    y: -D.h / 2,
    w: D.w,
    h: D.h,
    fill: WATCH_MATERIALS.fecha,
  });

  // 6 · Piezas aplicadas: marco de fecha, puntos, triángulo, barras, aplique.
  out.push({
    kind: "rect",
    capa: "aplicado",
    x: D.cx - D.w / 2 - D.rim / 2,
    y: -D.h / 2 - D.rim / 2,
    w: D.w + D.rim,
    h: D.h + D.rim,
    rx: 0.12,
    fill: "none",
    stroke: rim,
    strokeWidth: D.rim,
  });
  for (const h of HOURS_WITH_DOTS) {
    const p = polar(L.dots.r, h * 30);
    out.push({ kind: "circle", capa: "aplicado", cx: p.x, cy: p.y, r: L.dots.dotR, fill: lume, stroke: rim, strokeWidth: L.dots.rimW });
  }
  const T = L.triangle;
  out.push({
    kind: "path",
    capa: "aplicado",
    d: `M${f(-T.halfW)} ${f(-T.outerR)}L${f(T.halfW)} ${f(-T.outerR)}L0 ${f(-T.tipR)}Z`,
    fill: lume,
    stroke: rim,
    strokeWidth: T.rimW,
    strokeLinejoin: "round",
  });
  const B = L.bar;
  out.push(
    { kind: "rect", capa: "aplicado", x: -B.w / 2, y: B.r - B.len / 2, w: B.w, h: B.len, rx: 0.14, fill: lume, stroke: rim, strokeWidth: B.rimW },
    { kind: "rect", capa: "aplicado", x: -B.r - B.len / 2, y: -B.w / 2, w: B.len, h: B.w, rx: 0.14, fill: lume, stroke: rim, strokeWidth: B.rimW },
  );
  const A = L.applique;
  out.push({ kind: "rect", id: "aplique", capa: "aplicado", x: A.cx - A.w / 2, y: A.cy - A.h / 2, w: A.w, h: A.h, fill: "none" });

  return out;
}

// ===========================================================================
// TAPA — campo grabable Ø24, visto por detrás con las 12 arriba (= archivo láser).
// ===========================================================================
export const CASEBACK_RING_TEXT = "PEDRO YORUBA · ENSAMBLADO A MANO EN MIAMI · ACERO 316L";

export const CASEBACK_LAYOUT = {
  /** Radio del campo (Ø24). */
  fieldR: WATCH_SPECS.casebackFieldMm / 2,
  /** Filete exterior y filete interior del anillo de texto. */
  borderR: 11.6,
  innerR: 9.6,
  lineW: 0.1,
  /** Texto del anillo: radio de la línea base y tamaño. */
  ring: { r: 10.2, size: 1.15 },
  /** Zona libre del centro (radio) y margen a los filetes. */
  centerR: 9.6,
  margin: 0.9,
  sign: { inkH: 6.2, inkHCompact: 5.2 },
  name: { size: 1.25, trackEm: 0.06 },
  line: { size: 1.4, trackEm: 0.05 },
  fecha: { size: 1.05, trackEm: 0.12 },
  gap: 0.6,
} as const;

/** "1984-03-15" → "15 · 03 · 1984" (como se graba). */
export function formatFecha(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d} · ${m} · ${y}`;
}

/** Todo lo que se graba en la tapa (más la guía del campo, capa 'guia').
 *  `ink` = color de lo grabado: negro para el láser, gris acero para la vista. */
export function casebackPrimitives(c: WatchConfig, opts: { ink?: string } = {}): Primitive[] {
  const L = CASEBACK_LAYOUT;
  const ink = opts.ink ?? "#000000";
  const font: DialFont = c.tapa.fuente === "fina" ? "py-dial-fina" : "py-dial";
  // El anillo fijo: continuo (el separador final une el final con el principio)
  // y girado para que "PEDRO YORUBA" quede centrado arriba, a las 12.
  const ring: ArcText = {
    kind: "arcText",
    capa: "grabado",
    text: `${CASEBACK_RING_TEXT} · `,
    cx: 0,
    cy: 0,
    r: L.ring.r,
    centerDeg: 0,
    spanDeg: 360,
    font: "py-dial",
    size: L.ring.size,
    weight: 600,
    fill: ink,
  };
  const brand = CASEBACK_RING_TEXT.indexOf(" ·");
  const g = arcGlyphs(ring);
  ring.centerDeg = -(g[0].rotate + g[brand - 1].rotate) / 2;
  const out: Primitive[] = [
    { kind: "circle", id: "campo", capa: "guia", cx: 0, cy: 0, r: L.fieldR, fill: "none", stroke: "#00a0e0", strokeWidth: 0.05 },
    { kind: "circle", capa: "grabado", cx: 0, cy: 0, r: L.borderR, fill: "none", stroke: ink, strokeWidth: L.lineW },
    { kind: "circle", capa: "grabado", cx: 0, cy: 0, r: L.innerR, fill: "none", stroke: ink, strokeWidth: L.lineW },
    ring,
  ];

  // El centro: signo, su nombre, dos líneas y la fecha, apilados y centrados.
  type Item = { h: number; draw: (top: number) => void };
  const items: Item[] = [];
  const lines = [c.tapa.linea1.trim(), c.tapa.linea2.trim()].filter(Boolean);
  const fecha = c.tapa.fecha ? formatFecha(c.tapa.fecha) : "";
  const textCount = lines.length + (fecha ? 1 : 0);
  // Ancho útil a la altura y (cuerda del círculo central menos el margen).
  const chord = (y: number) => 2 * Math.sqrt(Math.max(0, L.centerR ** 2 - y ** 2)) - 2 * L.margin;

  const textItem = (text: string, spec: { size: number; trackEm: number }, weight: number) => {
    const capH = spec.size * 0.72;
    items.push({
      h: capH,
      draw: (top) => {
        const maxW = Math.min(chord(top), chord(top + capH));
        const size = fitTextSize(text, font, spec.size, maxW, spec.trackEm);
        out.push({
          kind: "text",
          capa: "grabado",
          text,
          x: 0,
          y: top + capH,
          font,
          size,
          anchor: "middle",
          letterSpacing: size * spec.trackEm,
          weight,
          maxWidth: maxW,
          fill: ink,
        });
      },
    });
  };

  if (c.tapa.signo) {
    const sign = c.tapa.signo;
    const inkH = textCount >= 3 ? L.sign.inkHCompact : L.sign.inkH;
    items.push({
      h: inkH,
      draw: (top) => out.push(...signPrimitives(sign, 0, top + inkH / 2, inkH, ink, "grabado", c.tapa.marcas)),
    });
    const name = signName(sign);
    if (name) textItem(name, L.name, 600);
  }
  // Sin signo, el texto es lo único del centro: se graba más grande.
  const big = c.tapa.signo ? 1 : 1.3;
  for (const line of lines) textItem(line, { ...L.line, size: L.line.size * big }, 500);
  if (fecha) textItem(fecha, { ...L.fecha, size: L.fecha.size * big }, 500);

  if (items.length) {
    const total = items.reduce((s, it) => s + it.h, 0) + L.gap * (items.length - 1);
    let top = -total / 2;
    for (const it of items) {
      it.draw(top);
      top += it.h + L.gap;
    }
  }
  return out;
}

/** Colocación de cada letra de un ArcText: centro de la letra sobre la línea
 *  base, su giro (grados, horario; 0 = derecha a las 12) y su tamaño. Las
 *  letras se reparten por su ancho estimado y el sobrante se reparte como
 *  espaciado, así que el texto llena exactamente `spanDeg`; si no cabe, todas
 *  encogen por igual. Compártelo con el canvas de la 3D. */
export function arcGlyphs(p: ArcText): { ch: string; x: number; y: number; rotate: number; size: number }[] {
  const chars = [...p.text];
  if (!chars.length) return [];
  const span = Math.min(p.spanDeg, 360);
  const L = (Math.PI * p.r * span) / 180;
  const natural = chars.map((ch) => estimateTextWidth(ch, p.font, p.size));
  const sum = natural.reduce((a, b) => a + b, 0);
  const k = sum > L * 0.92 ? (L * 0.92) / sum : 1;
  const size = p.size * k;
  const adv = natural.map((a) => a * k);
  const total = sum * k;
  // El sobrante se reparte como espaciado, y un espacio se lleva 2.5 partes:
  // con mucho espaciado entre letras, las palabras se siguen distinguiendo.
  const weight = chars.map((ch) => (ch === " " ? 2.5 : 1));
  const unit = (L - total) / weight.reduce((a, b) => a + b, 0);
  let at = 0;
  return chars.map((ch, i) => {
    const gap = unit * weight[i];
    const mid = at + (adv[i] + gap) / 2;
    at += adv[i] + gap;
    const deg = p.centerDeg - span / 2 + (mid / p.r) * (180 / Math.PI);
    const q = polar(p.r, deg);
    return { ch, x: p.cx + q.x, y: p.cy + q.y, rotate: deg, size };
  });
}

// ===========================================================================
// toSvg — primitivas → SVG (texto plano; funciona en el servidor).
// ===========================================================================
/** Número corto para SVG: `dp` decimales como mucho (3 = una micra), sin
 *  ceros de sobra. */
export function fmt(n: number, dp = 3): string {
  const s = Number(n.toFixed(dp)).toString();
  return s === "-0" ? "0" : s;
}

export function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/** Las primitivas como elementos SVG (sin <svg>), listas para meter en otro
 *  SVG. `idPrefix` evita choques de id si hay varios SVG en una misma página;
 *  `decimals` baja la precisión (2 = 10 µm, de sobra para una miniatura). */
export function primitivesToSvg(
  prims: readonly Primitive[],
  opts: { idPrefix?: string; decimals?: number } = {},
): string {
  const pre = opts.idPrefix ?? "pya";
  const dp = opts.decimals ?? 3;
  const f = (n: number) => fmt(n, dp);
  const paint = (p: PrimBase): string => {
    let s = ` fill="${p.fill ?? "none"}"`;
    if (p.stroke) s += ` stroke="${p.stroke}" stroke-width="${f(p.strokeWidth ?? 0.1)}"`;
    if (p.strokeLinejoin) s += ` stroke-linejoin="${p.strokeLinejoin}"`;
    return s;
  };
  let body = "";
  for (const p of prims) {
    const id = p.id ? ` id="${pre}-${p.id}"` : "";
    switch (p.kind) {
      case "circle":
        body += `<circle${id} cx="${f(p.cx)}" cy="${f(p.cy)}" r="${f(p.r)}"${paint(p)}/>`;
        break;
      case "rect": {
        if (p.rotate && !p.rx && !p.stroke && !p.id && p.fill && p.fill !== "none") {
          // Un rectángulo girado sin bordes = una línea de su ancho (más corto).
          const c = { x: p.x + p.w / 2, y: p.y + p.h / 2 };
          const a = (p.rotate * Math.PI) / 180;
          const long = p.h >= p.w;
          const half = (long ? p.h : p.w) / 2;
          const [ux, uy] = long ? [-Math.sin(a), Math.cos(a)] : [Math.cos(a), Math.sin(a)];
          body +=
            `<line x1="${f(c.x - ux * half)}" y1="${f(c.y - uy * half)}" x2="${f(c.x + ux * half)}" y2="${f(c.y + uy * half)}"` +
            ` stroke="${p.fill}" stroke-width="${f(long ? p.w : p.h)}"/>`;
          break;
        }
        const rot = p.rotate ? ` transform="rotate(${f(p.rotate)} ${f(p.x + p.w / 2)} ${f(p.y + p.h / 2)})"` : "";
        const rx = p.rx ? ` rx="${f(p.rx)}"` : "";
        body += `<rect${id} x="${f(p.x)}" y="${f(p.y)}" width="${f(p.w)}" height="${f(p.h)}"${rx}${rot}${paint(p)}/>`;
        break;
      }
      case "path":
        body += `<path${id} d="${p.d}"${p.fillRule === "evenodd" ? ' fill-rule="evenodd"' : ""}${paint(p)}/>`;
        break;
      case "text": {
        // letter-spacing también se añade tras la última letra: se compensa
        // para que el texto quede de verdad centrado.
        const shift = p.anchor === "middle" ? p.letterSpacing / 2 : p.anchor === "end" ? p.letterSpacing : 0;
        const est = estimateTextWidth(p.text, p.font, p.size, p.letterSpacing);
        const squeeze =
          p.maxWidth && est > p.maxWidth * 0.98 ? ` textLength="${f(p.maxWidth)}" lengthAdjust="spacingAndGlyphs"` : "";
        body +=
          `<text${id} x="${f(p.x + shift)}" y="${f(p.y)}" font-family="${FONT_STACKS[p.font]}" font-size="${f(p.size)}"` +
          `${p.weight ? ` font-weight="${p.weight}"` : ""} text-anchor="${p.anchor}"` +
          `${p.letterSpacing ? ` letter-spacing="${f(p.letterSpacing)}"` : ""}${squeeze}${paint(p)}>${escapeXml(p.text)}</text>`;
        break;
      }
      case "arcText": {
        // Letra a letra (la misma colocación que usa el canvas de la 3D): no
        // depende de <textPath>, que muchos programas de láser no importan.
        const glyphs = arcGlyphs(p)
          .map(
            (g) =>
              `<text x="${f(g.x)}" y="${f(g.y)}" transform="rotate(${f(g.rotate)} ${f(g.x)} ${f(g.y)})"` +
              `${g.size !== p.size ? ` font-size="${f(g.size)}"` : ""} text-anchor="middle">${escapeXml(g.ch)}</text>`,
          )
          .join("");
        body +=
          `<g${id} font-family="${FONT_STACKS[p.font]}" font-size="${f(p.size)}"${p.weight ? ` font-weight="${p.weight}"` : ""}${paint(p)}>` +
          `${glyphs}</g>`;
        break;
      }
    }
  }
  return body;
}

/** Caja [x, y, w, h] del círculo o rectángulo más exterior (el disco). */
function boundsOf(prims: readonly Primitive[]): [number, number, number, number] {
  let r = 0;
  for (const p of prims) {
    if (p.kind === "circle") r = Math.max(r, Math.hypot(p.cx, p.cy) + p.r);
    if (p.kind === "rect") r = Math.max(r, Math.hypot(Math.abs(p.x) + p.w, Math.abs(p.y) + p.h));
  }
  r = r || DIAL_LAYOUT.r;
  return [-r, -r, 2 * r, 2 * r];
}

export interface ToSvgOptions {
  /** Píxeles por mm. Sin él, el SVG mide en mm reales (width="30.5mm"): 1:1. */
  mmToPx?: number;
  /** Nunca se refleja: el campo existe para que quien llama lo diga explícito. */
  mirror?: false;
  /** [x, y, w, h] en mm. Por defecto, el disco más exterior. */
  viewBox?: readonly [number, number, number, number];
  idPrefix?: string;
  /** <title> del documento. */
  title?: string;
  /** Color de fondo (rect detrás de todo). Sin él, transparente. */
  background?: string;
}

/** Un documento SVG completo, en mm, sin espejo. */
export function toSvg(prims: readonly Primitive[], opts: ToSvgOptions = {}): string {
  const [x, y, w, h] = opts.viewBox ?? boundsOf(prims);
  const size = opts.mmToPx ? `width="${f(w * opts.mmToPx)}" height="${f(h * opts.mmToPx)}"` : `width="${f(w)}mm" height="${f(h)}mm"`;
  const title = opts.title ? `<title>${escapeXml(opts.title)}</title>` : "";
  const bg = opts.background ? `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${opts.background}"/>` : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" ${size} viewBox="${f(x)} ${f(y)} ${f(w)} ${f(h)}">` +
    title +
    bg +
    primitivesToSvg(prims, { idPrefix: opts.idPrefix }) +
    `</svg>`
  );
}
