// ---------------------------------------------------------------------------
// TEXTO A CURVAS para los archivos de producción del reloj.
//
// laserSvg() y dialPrintSvg() (lib/watch-svg.ts) escriben el texto como
// <text> con una pila de fuentes: en la hoja del taller (un <img> SVG no carga
// fuentes web) y en la máquina que abra la descarga (LightBurn, EzCad,
// Illustrator…) cada uno lo pintaba con la letra que tuviera a mano, y la
// prueba que aprueba el cliente podía no ser lo que se graba. Aquí cada letra
// se convierte en su contorno real (lib/watch-glyphs.ts, Cinzel / Cormorant
// Garamond) con la MISMA colocación que las primitivas: línea base, ancla,
// espaciado, ancho máximo y, en el anillo de la tapa, el centro y el giro de
// cada letra (arcGlyphs). El resultado no lleva ni un <text>: lo que se ve en
// la hoja es exactamente lo que se imprime y se graba.
//
// Solo para el servidor (la hoja del taller y los chequeos): la tabla de
// contornos pesa ~116 KB y no debe viajar al navegador.
// ---------------------------------------------------------------------------
import { GLYPH_FONTS, type GlyphFont } from "./watch-glyphs";
import { arcGlyphs, fmt, type ArcText, type DialFont, type PathPrim, type Primitive, type TextRun } from "./watch-art";
import { dialPrintSvg, laserSvg } from "./watch-svg";
import type { WatchConfig } from "./watch";

/** [a, b, c, d, e, f]: x' = a·x + c·y + e ; y' = b·x + d·y + f (como SVG). */
type Matrix = readonly [number, number, number, number, number, number];

/** 3 decimales = una micra: de sobra para el láser y la impresión. */
const f = (n: number) => fmt(n, 3);

/** Números de un trazo con el separador mínimo (un "-" ya separa): el archivo
 *  pesa menos y la hoja del taller, que lo incrusta, también. */
function joinNums(nums: readonly string[]): string {
  let out = "";
  for (const n of nums) out += out && !n.startsWith("-") ? ` ${n}` : n;
  return out;
}

/** El glifo de un carácter (NFC). Un carácter fuera de la tabla no debería
 *  llegar nunca (las listas permitidas de lib/watch.ts y check-watch-data lo
 *  impiden); si llega, ocupa lo que un espacio y no se dibuja. */
function glyphOf(font: GlyphFont, ch: string): readonly [number, string] {
  return font.glyphs[ch] ?? font.glyphs[ch.normalize("NFC")] ?? [font.glyphs[" "]?.[0] ?? font.upm / 4, ""];
}

/** Los caracteres que la tabla de contornos no tiene (vacío = todo se dibuja). */
export function missingGlyphs(text: string, font: DialFont): string[] {
  const F = GLYPH_FONTS[font];
  return [...text.normalize("NFC")].filter((ch) => !F.glyphs[ch]);
}

/** Avances en unidades de la fuente, con el interletraje de cada pareja. */
function advances(font: GlyphFont, chars: readonly string[]): number[] {
  return chars.map((ch, i) => glyphOf(font, ch)[0] + (i + 1 < chars.length ? font.kern[ch + chars[i + 1]] ?? 0 : 0));
}

/** Ancho REAL (mm) de una línea de texto: avances + interletraje + espaciado
 *  entre letras (no tras la última). */
export function textWidthMm(text: string, font: DialFont, size: number, letterSpacing = 0): number {
  const F = GLYPH_FONTS[font];
  const chars = [...text.normalize("NFC")];
  if (!chars.length) return 0;
  const units = advances(F, chars).reduce((s, a) => s + a, 0);
  return (units * size) / F.upm + letterSpacing * (chars.length - 1);
}

/** Aplica la matriz a un trazo absoluto (M L Q C Z) en unidades de la fuente. */
function transformPath(d: string, m: Matrix): string {
  const [a, b, c, dd, e, ff] = m;
  let out = "";
  const re = /([MLQCZ])([^MLQCZ]*)/g;
  for (let hit = re.exec(d); hit; hit = re.exec(d)) {
    const cmd = hit[1];
    if (cmd === "Z") {
      out += "Z";
      continue;
    }
    const nums = hit[2].trim().split(/[\s,]+/).map(Number);
    const pts: string[] = [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const x = nums[i];
      const y = nums[i + 1];
      pts.push(f(a * x + c * y + e), f(b * x + dd * y + ff));
    }
    out += cmd + joinNums(pts);
  }
  return out;
}

/** Un TextRun → un trazo: misma línea base, ancla y espaciado; si el ancho
 *  real pasa de maxWidth, se comprime en horizontal hasta caber (lo mismo que
 *  hace textLength en la vista previa). */
export function textRunToPath(p: TextRun): PathPrim {
  const F = GLYPH_FONTS[p.font];
  const chars = [...p.text.normalize("NFC")];
  const k = p.size / F.upm;
  const adv = advances(F, chars);
  const natural = textWidthMm(p.text, p.font, p.size, p.letterSpacing);
  const sx = p.maxWidth && natural > p.maxWidth ? p.maxWidth / natural : 1;
  const w = natural * sx;
  const x0 = p.anchor === "middle" ? p.x - w / 2 : p.anchor === "end" ? p.x - w : p.x;
  let pen = 0;
  let d = "";
  chars.forEach((ch, i) => {
    const path = glyphOf(F, ch)[1];
    if (path) d += transformPath(path, [sx * k, 0, 0, -k, x0 + sx * pen, p.y]);
    pen += adv[i] * k + p.letterSpacing;
  });
  return outlineOf(p, d);
}

/** Un ArcText → un trazo: cada letra centrada en su punto del círculo y girada
 *  como en la vista previa (arcGlyphs: la misma fuente de verdad). */
export function arcTextToPath(p: ArcText): PathPrim {
  const F = GLYPH_FONTS[p.font];
  let d = "";
  for (const g of arcGlyphs(p)) {
    const [adv, path] = glyphOf(F, g.ch);
    if (!path) continue;
    const k = g.size / F.upm;
    const half = (adv * k) / 2;
    const t = (g.rotate * Math.PI) / 180;
    const cos = Math.cos(t);
    const sin = Math.sin(t);
    // Letra en su sitio: x = −half + k·X, y = −k·Y (y hacia abajo), girada θ
    // (horario) alrededor de su punto (g.x, g.y) de la línea base.
    d += transformPath(path, [cos * k, sin * k, sin * k, -cos * k, g.x - cos * half, g.y - sin * half]);
  }
  return outlineOf(p, d);
}

function outlineOf(p: TextRun | ArcText, d: string): PathPrim {
  return {
    kind: "path",
    ...(p.id ? { id: p.id } : {}),
    capa: p.capa,
    d,
    fill: p.fill ?? "#000000",
    ...(p.stroke ? { stroke: p.stroke, strokeWidth: p.strokeWidth } : {}),
  };
}

/** Las primitivas con todo el texto convertido a curvas (el resto, igual). */
export function outlinePrimitives(prims: readonly Primitive[]): Primitive[] {
  return prims.map((p) => (p.kind === "text" ? textRunToPath(p) : p.kind === "arcText" ? arcTextToPath(p) : p));
}

/** Archivo láser de la tapa (lib/watch-svg.ts → laserSvg) con el texto en curvas. */
export function laserSvgCurvas(c: WatchConfig): string {
  return laserSvg(c, { curvas: outlinePrimitives });
}

/** Archivo de impresión de la esfera (dialPrintSvg) con el texto en curvas. */
export function dialPrintSvgCurvas(c: WatchConfig): string {
  return dialPrintSvg(c, { curvas: outlinePrimitives });
}

/** Los puntos (mm) de un trazo ABSOLUTO M L Q C Z, de control incluidos.
 *  null si usa otros comandos. */
function pathPoints(d: string): [number, number][] | null {
  if (/[^MLQCZ\d.\s,eE+-]/.test(d)) return null;
  const nums = (d.match(/-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? []).map(Number);
  const pts: [number, number][] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
  return pts.length ? pts : null;
}

/** La distancia máxima (mm) de un trazo al centro (0, 0), puntos de control
 *  incluidos (cota por exceso): ¿cabe en el campo / la zona impresa? */
export function pathReach(d: string): number | null {
  const pts = pathPoints(d);
  return pts ? Math.max(...pts.map(([x, y]) => Math.hypot(x, y))) : null;
}

/** Caja [x0, y0, x1, y1] (mm) de un trazo ABSOLUTO de rectas y curvas
 *  (M L Q C Z, el que sale de aquí), puntos de control incluidos (cota por
 *  exceso): para los chequeos de que el texto cabe. null si el trazo usa otros
 *  comandos (arcos, relativos…) o está vacío. */
export function pathBounds(d: string): [number, number, number, number] | null {
  const pts = pathPoints(d);
  if (!pts) return null;
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  return [x0, y0, x1, y1];
}
