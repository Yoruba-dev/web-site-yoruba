#!/usr/bin/env node
/**
 * Genera las tablas de contornos (curvas) de las letras que puede llevar un
 * reloj, para que los ARCHIVOS DE PRODUCCIÓN (láser de la tapa e impresión de
 * la esfera), la vista previa y la 3D salgan con el texto ya convertido en
 * trazos y nunca dependan de las fuentes de la máquina que los abra
 * (LightBurn, EzCad, Illustrator…). Ver lib/watch-curvas.ts.
 *
 * Solo se corre cuando cambia una fuente del reloj. NO es parte del build: el
 * resultado se guarda en el repo.
 *
 * Qué escribe cada modo (en lib/, o en --salida):
 *   --solo fina      lib/watch-glyphs-fina.ts    GLYPH_PY_DIAL_FINA (contornos + interletraje)
 *                    lib/watch-glyph-metrics.ts  FINA_ADV (avances / upm, para estimateTextWidth;
 *                                                 lo único que llega a la carga inicial)
 *   --solo clasica   lib/watch-glyphs-clasica.ts GLYPH_PY_DIAL + la interfaz GlyphFont
 *   (sin --solo)     las tres
 * lib/watch-glyphs.ts es el barril (escrito a mano): este script no lo toca.
 *
 * Uso habitual — la letra FINA (Cormorant Garamond Italic, variable, en 500):
 *   node scripts/gen-watch-glyphs.mjs \
 *     --fontkit <ruta a un paquete fontkit o @pdf-lib/fontkit> \
 *     --solo fina --wght 500 \
 *     --fina <CormorantGaramond-Italic-wght.ttf>
 * fontkit NO es dependencia del proyecto: se le pasa la ruta de uno.
 * --wght es obligatorio si la fuente es variable (se instancia con
 * getVariation); con una fuente estática no se usa. La licencia (OFL.txt) se
 * copia en la cabecera: por defecto la que está junto a la fuente; si no,
 * --ofl <OFL.txt>.
 *
 * La CLÁSICA (Cinzel Regular) NO se regenera: su fuente no está en el repo y
 * lib/watch-glyphs-clasica.ts se movió byte a byte del archivo antiguo (el
 * 2026-11-22). Solo si llegan los originales "PY Dial" del taller, a propósito:
 *   node scripts/gen-watch-glyphs.mjs --fontkit … --solo clasica --clasica <fuente> [--wght-clasica N]
 *
 * --salida <carpeta>: escribe ahí en vez de lib/ (para probar sin tocar el repo).
 *
 * Sale con código 1 si a una fuente le falta cualquier glifo de CHARS.
 *
 * Fuentes: Cinzel (Natanael Gama) y Cormorant Garamond (Christian Thalmann,
 * the Cormorant Project Authors), ambas SIL Open Font License 1.1 — permite
 * incrustar y convertir a curvas.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};
const solo = args.solo;
if (solo !== undefined && solo !== "fina" && solo !== "clasica") fail(`--solo ${solo}: usa "fina" o "clasica".`);
const doFina = solo !== "clasica";
const doClasica = solo !== "fina";
for (const k of ["fontkit", ...(doClasica ? ["clasica"] : []), ...(doFina ? ["fina"] : [])]) {
  if (!args[k]) fail(`Falta --${k}. Ver la cabecera de este archivo.`);
}
const require = createRequire(import.meta.url);
const fontkit = require(path.resolve(args.fontkit));

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(args.salida ?? path.join(here, "..", "lib"));
fs.mkdirSync(outDir, { recursive: true });

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

/** Abre la fuente y, si es variable, la instancia en `wght` (getVariation). */
function open(file, id, wghtArg) {
  const base = fontkit.create(fs.readFileSync(path.resolve(file)));
  const axis = base.variationAxes?.wght;
  const italic = (base.italicAngle ?? 0) !== 0 || Boolean(base["OS/2"]?.fsSelection?.italic);
  const family = base.getName?.("preferredFamily") || base.familyName;
  if (!axis) {
    if (wghtArg !== undefined) fail(`${id}: la fuente no es variable; quita el --wght.`);
    return { font: base, label: `${base.familyName} ${base.subfamilyName}`, source: base, italic, wght: null, instance: null };
  }
  if (wghtArg === undefined) fail(`${id}: la fuente es variable (wght ${axis.min}–${axis.max}); di qué peso con --wght${id === "clasica" ? "-clasica" : ""}.`);
  const wght = Number(wghtArg);
  if (!Number.isFinite(wght) || wght < axis.min || wght > axis.max) fail(`${id}: --wght ${wghtArg} fuera del eje (${axis.min}–${axis.max}).`);
  const font = base.getVariation({ wght });
  const instance = Object.entries(base.namedVariations ?? {}).find(([, v]) => v.wght === wght)?.[0] ?? null;
  return { font, label: `${family} ${italic ? "Italic" : "Regular"} ${wght}`, source: base, italic, wght, instance };
}

function build(file, id, wghtArg) {
  const o = open(file, id, wghtArg);
  const { font } = o;
  const glyphs = {};
  const ids = {};
  const missing = [];
  for (const ch of CHARS) {
    const cp = ch.codePointAt(0);
    if (!font.hasGlyphForCodePoint(cp)) {
      missing.push(ch);
      continue;
    }
    const g = font.glyphForCodePoint(cp);
    ids[ch] = g.id;
    glyphs[ch] = [r(g.advanceWidth), glyphPath(g)];
  }
  if (missing.length) fail(`${id}: faltan glifos para ${JSON.stringify(missing.join(""))}`);
  // Interletraje (GPOS/kern) de ESTA instancia: lo que layout() añade a cada
  // avance (en una fuente variable, ya con las variaciones del peso). Solo las
  // parejas distintas de 0, y solo si layout() dibuja los MISMOS glifos que la
  // tabla: aquí cada letra se dibuja suelta, así que una ligadura (fi, Th…) o
  // una alternativa contextual (la Q de cola larga ante otra letra) no aporta
  // interletraje.
  const kern = {};
  const skipped = { ligadura: 0, alternativa: 0 };
  for (const a of CHARS) {
    for (const b of CHARS) {
      if (a === " " || b === " ") continue;
      const run = font.layout(a + b);
      if (run.glyphs.length !== 2) {
        skipped.ligadura++;
        continue;
      }
      if (run.glyphs[0].id !== ids[a] || run.glyphs[1].id !== ids[b]) {
        skipped.alternativa++;
        continue;
      }
      const k = r(run.positions.reduce((s, p, i) => s + p.xAdvance - run.glyphs[i].advanceWidth, 0));
      if (k) kern[a + b] = k;
    }
  }
  return {
    ...o,
    version: (o.source.version ?? "").toString().trim(),
    sourceName: `${o.source.familyName} ${o.source.subfamilyName}`,
    copyright: (o.source.copyright ?? "").toString().trim(),
    upm: font.unitsPerEm,
    italicAngle: o.source.italicAngle ?? 0,
    glyphs,
    kern,
    skipped,
  };
}

/** La licencia de la fuente como líneas de comentario (atribución OFL). */
function licenseComment(fontFile, oflArg, id) {
  const file = path.resolve(oflArg ?? path.join(path.dirname(path.resolve(fontFile)), "OFL.txt"));
  if (!fs.existsSync(file)) fail(`${id}: no encuentro la licencia (${file}); pásala con --ofl <OFL.txt>.`);
  return fs
    .readFileSync(file, "utf8")
    .replace(/\r\n?/g, "\n")
    .trimEnd()
    .split("\n")
    .map((l) => `//${l.trimEnd() ? ` ${l.trimEnd()}` : ""}`)
    .join("\n");
}

const RULE = "// ---------------------------------------------------------------------------";
const IFACE =
  `export interface GlyphFont {\n  family: string;\n  upm: number;\n  /** carácter → [avance, trazo SVG en unidades de la fuente, y hacia arriba] */\n  glyphs: Readonly<Record<string, readonly [number, string]>>;\n  /** "AV" → ajuste en unidades (negativo = se juntan) */\n  kern: Readonly<Record<string, number>>;\n}\n`;
const tableOf = (f) => JSON.stringify({ family: f.label, upm: f.upm, glyphs: f.glyphs, kern: f.kern });
const write = (name, text) => {
  const file = path.join(outDir, name);
  fs.writeFileSync(file, text);
  const rel = path.relative(process.cwd(), file);
  return `${rel.startsWith("..") ? file : rel} · ${(fs.statSync(file).size / 1024).toFixed(1)} KB`;
};
const origin = (f) =>
  f.wght === null
    ? `${f.sourceName} (${f.version})`
    : `la fuente variable "${f.sourceName}" (${f.version}),\n//     instanciada en wght ${f.wght}${f.instance ? ` («${f.instance}»)` : ""} con fontkit getVariation()`;
const report = [];
const modo = solo ? `--solo ${solo}` : "fina + clásica";

if (doFina) {
  const f = build(args.fina, "fina", args.wght);
  const slant = f.italic
    ? `// La cursiva es la de la propia fuente (ángulo de cursiva ${f.italicAngle}°): los contornos
// ya vienen inclinados; nada la finge con un sesgo.
`
    : "";
  const head = `${RULE}
// GENERADO por scripts/gen-watch-glyphs.mjs (${modo}) — no editar a mano.
//
// LETRA FINA ('py-dial-fina') del grabado de la tapa:
//   ${f.label}, OFL 1.1
//   = ${origin(f)}.
${slant}//
// Contornos en unidades de la fuente (upm ${f.upm}), y hacia ARRIBA, más el
// interletraje GPOS de esa misma instancia (sin ligaduras ni alternativas
// contextuales: cada letra se dibuja con su glifo propio). Lo importa solo el
// barril lib/watch-glyphs.ts → lib/watch-curvas.ts (el servidor y los trozos
// diferidos), nunca la carga inicial. Los avances sueltos, ligeros, están en
// lib/watch-glyph-metrics.ts (FINA_ADV) para estimateTextWidth().
//
// Licencia — el OFL.txt de la fuente, copiado tal cual:
//
${licenseComment(args.fina, args.ofl, "fina")}
${RULE}
`;
  const adv = Object.fromEntries(CHARS.map((ch) => [ch, Number((f.glyphs[ch][0] / f.upm).toFixed(4))]));
  const metrics = `// GENERADO por scripts/gen-watch-glyphs.mjs (${modo}) — no editar a mano.
// Avance de cada carácter de la letra fina (${f.label}), en em
// (avance / upm ${f.upm}), sin interletraje. Lo usa estimateTextWidth()
// (lib/watch-art.ts) para medir el grabado "Fina" con sus anchos reales. Es lo
// único de las tablas de letras que llega a la carga inicial: debe seguir
// pesando poco (≤ 3 KB).
// ${f.copyright || "Cormorant Garamond"} — SIL Open Font License 1.1
// (el texto completo, en lib/watch-glyphs-fina.ts).
export const FINA_ADV: Readonly<Record<string, number>> = ${JSON.stringify(adv)};
`;
  report.push(
    write(
      "watch-glyphs-fina.ts",
      `${head}import type { GlyphFont } from "./watch-glyphs-clasica";\n\nexport const GLYPH_PY_DIAL_FINA: GlyphFont = ${tableOf(f)};\n`,
    ) + ` · ${f.label} · interletraje ${Object.keys(f.kern).length} parejas (sin contar ${f.skipped.ligadura} ligaduras y ${f.skipped.alternativa} alternativas)`,
  );
  report.push(write("watch-glyph-metrics.ts", metrics));
}

if (doClasica) {
  const f = build(args.clasica, "clasica", args["wght-clasica"]);
  const head = `${RULE}
// GENERADO por scripts/gen-watch-glyphs.mjs (${modo}) — no editar a mano.
//
// LETRA CLÁSICA ('py-dial'): ${f.label}, SIL Open Font License 1.1
//   = ${origin(f)}.
// Contornos en unidades de la fuente (upm ${f.upm}), y hacia ARRIBA, más el
// interletraje de cada pareja. La usan el texto de la esfera, el anillo fijo
// de la tapa y el grabado "Clásica". NO se regenera salvo a propósito (ver la
// cabecera del generador): cambiarla mueve todas esas letras.
//
// Aquí vive también la interfaz GlyphFont: la usan las dos tablas y el barril
// lib/watch-glyphs.ts, sin ciclos de importación.
${RULE}
`;
  report.push(write("watch-glyphs-clasica.ts", `${head}${IFACE}\nexport const GLYPH_PY_DIAL: GlyphFont = ${tableOf(f)};\n`) + ` · ${f.label}`);
}

console.log(`${CHARS.length} glifos por letra\n${report.map((l) => `  ${l}`).join("\n")}`);
