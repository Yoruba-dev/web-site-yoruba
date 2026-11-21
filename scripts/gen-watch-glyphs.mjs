#!/usr/bin/env node
/**
 * Genera lib/watch-glyphs.ts: los contornos (curvas) de las letras que puede
 * llevar un reloj, para que los ARCHIVOS DE PRODUCCIÓN (láser de la tapa e
 * impresión de la esfera) salgan con el texto ya convertido en trazos y nunca
 * dependan de las fuentes de la máquina que los abra (LightBurn, EzCad,
 * Illustrator…). Ver lib/watch-curvas.ts.
 *
 * Solo se corre cuando cambian las fuentes del reloj (p. ej. cuando lleguen los
 * originales "PY Dial" del taller). NO es parte del build: el resultado se
 * guarda en el repo.
 *
 * Uso (fontkit NO es dependencia del proyecto; se le pasa la ruta de uno):
 *   node scripts/gen-watch-glyphs.mjs \
 *     --fontkit <ruta a un paquete fontkit o @pdf-lib/fontkit> \
 *     --clasica <Cinzel .ttf/.otf/.woff/.woff2> \
 *     --fina <Cormorant Garamond .ttf/.otf/.woff/.woff2>
 *
 * Fuentes: Cinzel (Natanael Gama) y Cormorant Garamond (Christian Thalmann),
 * ambas SIL Open Font License 1.1 — permite incrustar y convertir a curvas.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
for (const k of ["fontkit", "clasica", "fina"]) {
  if (!args[k]) {
    console.error(`Falta --${k}. Ver la cabecera de este archivo.`);
    process.exit(1);
  }
}
const require = createRequire(import.meta.url);
const fontkit = require(path.resolve(args.fontkit));

// Todo lo que puede llegar a un texto del reloj: CASEBACK_ALLOW (que contiene
// a DIAL_TEXT_ALLOW y a los nombres de los signos) y el anillo fijo de la tapa.
const CHARS = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  ..."abcdefghijklmnopqrstuvwxyz",
  ..."0123456789",
  ..."ÁÉÍÓÚÜÑáéíóúüñ",
  ..." .,'·&/-",
];

const r = (n) => Math.round(n);

function glyphPath(glyph) {
  let d = "";
  for (const c of glyph.path.commands) {
    const a = c.args.map(r);
    if (c.command === "moveTo") d += `M${a[0]} ${a[1]}`;
    else if (c.command === "lineTo") d += `L${a[0]} ${a[1]}`;
    else if (c.command === "quadraticCurveTo") d += `Q${a[0]} ${a[1]} ${a[2]} ${a[3]}`;
    else if (c.command === "bezierCurveTo") d += `C${a[0]} ${a[1]} ${a[2]} ${a[3]} ${a[4]} ${a[5]}`;
    else if (c.command === "closePath") d += "Z";
  }
  return d;
}

function build(file, id) {
  const font = fontkit.create(fs.readFileSync(path.resolve(file)));
  const glyphs = {};
  const missing = [];
  for (const ch of CHARS) {
    const cp = ch.codePointAt(0);
    if (!font.hasGlyphForCodePoint(cp)) {
      missing.push(ch);
      continue;
    }
    const g = font.glyphForCodePoint(cp);
    glyphs[ch] = [r(g.advanceWidth), glyphPath(g)];
  }
  if (missing.length) {
    console.error(`${id}: faltan glifos para ${JSON.stringify(missing.join(""))}`);
    process.exit(1);
  }
  // Interletraje (GPOS/kern): lo que layout() añade a la pareja sobre la suma
  // de los avances. Solo las parejas distintas de 0.
  const kern = {};
  for (const a of CHARS) {
    for (const b of CHARS) {
      if (a === " " || b === " ") continue;
      const run = font.layout(a + b);
      // Una ligadura (fi, fl…) une dos letras en un glifo: aquí cada letra se
      // dibuja suelta, así que esa pareja no aporta interletraje.
      if (run.glyphs.length !== 2) continue;
      const sum = run.positions.reduce((s, p) => s + p.xAdvance, 0);
      const k = r(sum - glyphs[a][0] - glyphs[b][0]);
      if (k) kern[a + b] = k;
    }
  }
  return {
    family: font.familyName,
    style: font.subfamilyName,
    version: (font.version ?? "").toString().trim(),
    upm: font.unitsPerEm,
    glyphs,
    kern,
  };
}

const fonts = { "py-dial": build(args.clasica, "clasica"), "py-dial-fina": build(args.fina, "fina") };

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "..", "lib", "watch-glyphs.ts");
const head = `// ---------------------------------------------------------------------------
// GENERADO por scripts/gen-watch-glyphs.mjs — no editar a mano.
//
// Contornos de las letras del reloj (unidades de la fuente, y hacia ARRIBA) y
// el interletraje de cada pareja, para convertir el texto de los archivos de
// producción a curvas (lib/watch-curvas.ts). Solo lo importa el servidor (la
// hoja del taller): no viaja al navegador.
//
//   py-dial      → ${fonts["py-dial"].family} ${fonts["py-dial"].style} (${fonts["py-dial"].version})
//   py-dial-fina → ${fonts["py-dial-fina"].family} ${fonts["py-dial-fina"].style} (${fonts["py-dial-fina"].version})
//
// Ambas SIL Open Font License 1.1 (permite incrustar y convertir a curvas).
// Son los únicos cortes con los que se generó: la vista previa del creador
// pinta las mismas familias con la web (Cinzel 500–700, Cormorant 500/600), así
// que el archivo de producción sale con el MISMO diseño y la misma colocación,
// con un trazo algo más fino. Al llegar los originales "PY Dial" del taller,
// se vuelve a generar con ellos.
// ---------------------------------------------------------------------------
`;
const body =
  `export interface GlyphFont {\n  family: string;\n  upm: number;\n  /** carácter → [avance, trazo SVG en unidades de la fuente, y hacia arriba] */\n  glyphs: Readonly<Record<string, readonly [number, string]>>;\n  /** "AV" → ajuste en unidades (negativo = se juntan) */\n  kern: Readonly<Record<string, number>>;\n}\n\n` +
  `export const GLYPH_FONTS: Readonly<Record<"py-dial" | "py-dial-fina", GlyphFont>> = ${JSON.stringify(
    Object.fromEntries(Object.entries(fonts).map(([k, f]) => [k, { family: `${f.family} ${f.style}`, upm: f.upm, glyphs: f.glyphs, kern: f.kern }])),
  )};\n`;
fs.writeFileSync(out, head + body);
const kb = (fs.statSync(out).size / 1024).toFixed(1);
console.log(`lib/watch-glyphs.ts · ${kb} KB · ${CHARS.length} glifos × 2 · interletraje ${Object.keys(fonts["py-dial"].kern).length} + ${Object.keys(fonts["py-dial-fina"].kern).length} parejas`);
