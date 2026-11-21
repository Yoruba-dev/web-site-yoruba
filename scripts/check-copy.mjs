#!/usr/bin/env node
/**
 * Fails the build when the copy says something the shop must never say.
 *
 * 1. Third-party watch BRANDS and MODEL names, anywhere in the site's own code
 *    and text (app/, components/, lib/, public/llms.txt). The octagonal case
 *    already echoes a famous design; naming a brand or model next to it turns
 *    "joya de autor" into a look-alike claim (takedowns, Merchant suspension).
 *    The bracelet is "Brazalete integrado", never a third-party bracelet name.
 *
 * 2. Spiritual OUTCOME words, in the watch files only (paths containing
 *    "watch" or "reloj", plus the explicit WATCH_GLOBS below: the creator
 *    page, the watch components, the workshop sheet and the home band — listed
 *    by name so a future rename can't slip them out of scope; a glob that
 *    matches nothing yet is fine). The watch is sold as heritage and identity ("en los
 *    colores de…"), never as something that brings an outcome or arrives
 *    consecrated. Etsy (synced via DPL) and the FTC both care. Scoped to the
 *    watch files on purpose: the rest of the site has its own reviewed copy
 *    (e.g. the Odù heritage notes in lib/odu.ts), which this check does not
 *    police.
 *
 * 3. Origin and spec CLAIMS, in the watch files only (spec: risks → "Origin or
 *    claims liability"): no "Made in USA" / "hecho en EE.UU.", no "japonés"
 *    (the movement's marking is not confirmed), no "GMT" (no NH34), no dive or
 *    water-resistance claims, no "LumiNova" (lume is named only as the
 *    supplier certifies it). Origin copy is WATCH_ORIGIN only. If the owner
 *    confirms one of these facts, remove that entry here on purpose.
 *
 * Words are matched case- and accent-insensitively, on word boundaries. A
 * self-test runs first: every banned word must trip on a sample line.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOTS = ["app", "components", "lib"];
const EXTRA_FILES = ["public/llms.txt"];
const TEXT_EXT = /\.(tsx?|jsx?|mjs|cjs|css|md|mdx|json|txt|html|svg)$/i;

/** Brands and model names (spec: risks → look-alike design). */
const BRANDS = [
  "Patek",
  "Philippe",
  "Nautilus",
  "Aquanaut",
  "Rolex",
  "Submariner",
  "GMT-Master",
  "Jubilee",
  "Oyster",
  "Audemars",
  "Royal Oak",
  "Omega",
  "Seiko",
];

/** Outcome stems (a stem matches any ending: consagrado/a/os…). */
const OUTCOME = ["protección", "suerte", "consagrad", "bendecid"];
const WATCH_PATH = /watch|reloj/i;

/** The watch files, by name (POSIX paths relative to the storefront root).
 *  `**` = any depth, `*` = within one segment. Missing files are tolerated:
 *  the home band, for instance, may land after this check. */
const WATCH_GLOBS = [
  "app/creador-de-relojes/**",
  "components/watch/**",
  "components/diseno/WatchSheet.tsx",
  "components/home/RelojesCreador.tsx",
];
const globRe = (g) =>
  new RegExp(
    `^${g
      .split("**")
      .map((part) => part.split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join("[^/]*"))
      .join(".*")}$`,
  );
const watchGlobRes = WATCH_GLOBS.map((g) => [g, globRe(g)]);
const toPosix = (p) => p.split("\\").join("/");
const inWatchGlob = (rel) => watchGlobRes.some(([, re]) => re.test(toPosix(rel)));

/** Lower-case and strip accents so "Protección" = "proteccion". */
const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wordRe = (w, stem = false) =>
  new RegExp(`(?<![\\p{L}\\p{N}])${escape(fold(w)).replace(/ /g, "\\s+")}${stem ? "" : "(?![\\p{L}\\p{N}])"}`, "u");

/** Claims (folded text: lower case, no accents). [label, regex]. */
const B = "(?<![\\p{L}\\p{N}])";
const E = "(?![\\p{L}\\p{N}])";
const CLAIMS = [
  ["GMT", new RegExp(`${B}gmt${E}`, "u")],
  ["made in USA", new RegExp(`${B}made\\s+in\\s+(the\\s+)?(usa|u\\.\\s?s\\.(\\s?a\\.?)?|america)`, "u")],
  ["hecho en EE.UU.", new RegExp(`${B}hech[oa]s?\\s+en\\s+(los\\s+)?(ee\\.?\\s?uu|usa|u\\.\\s?s\\.|estados\\s+unidos|america)`, "u")],
  ["japonés", new RegExp(`${B}japon`, "u")],
  ["Japan", new RegExp(`${B}japan`, "u")],
  ["LumiNova", new RegExp(`${B}(super[\\s-]?)?luminova`, "u")],
  ["sumergible", new RegExp(`${B}sumergib`, "u")],
  ["buceo", new RegExp(`${B}buce(o|ar|ador)`, "u")],
  ["dive", new RegExp(`${B}div(e|er|ers|ing)${E}`, "u")],
  ["resistente al agua", new RegExp(`${B}resisten(te|tes|cia)\\s+al\\s+agua`, "u")],
  ["a prueba de agua", new RegExp(`${B}a\\s+prueba\\s+de\\s+agua`, "u")],
  ["impermeable", new RegExp(`${B}impermeab`, "u")],
  ["water resistant", new RegExp(`${B}water[\\s-]?(resist|proof)`, "u")],
];

const brandRes = BRANDS.map((w) => [w, wordRe(w)]);
const outcomeRes = OUTCOME.map((w) => [w, wordRe(w, true)]);

/** Every problem in one line of text. Brands everywhere; outcome words and
 *  claims only in the watch files. */
function scanLine(line, isWatch) {
  const text = fold(line);
  const found = [];
  for (const [word, re] of brandRes) if (re.test(text)) found.push(`marca/modelo ajeno "${word}"`);
  if (!isWatch) return found;
  for (const [word, re] of outcomeRes) if (re.test(text)) found.push(`palabra de resultado "${word}" en un archivo del reloj`);
  for (const [word, re] of CLAIMS) if (re.test(text)) found.push(`afirmación de origen/especificación "${word}" en un archivo del reloj`);
  return found;
}

// Self-test: each banned word trips on a sample line; clean copy does not.
const MUST_TRIP = [
  ...BRANDS.map((w) => [`Inspirado en el ${w}`, false]),
  ...OUTCOME.map((w) => [`Un reloj que da ${w}o`, true]),
  ["Bisel con escala GMT", true],
  ["Made in USA", true],
  ["Made in the U.S.A.", true],
  ["Hecho en EE.UU.", true],
  ["Hecho en EEUU", true],
  ["Hecho en Estados Unidos", true],
  ["Movimiento japonés", true],
  ["Maquinaria Japonesa", true],
  ["Japan movt", true],
  ["Lume Super-LumiNova C3", true],
  ["Índices con LumiNova", true],
  ["Reloj sumergible", true],
  ["Ideal para buceo", true],
  ["Para bucear", true],
  ["A true dive watch", true],
  ["Diver style", true],
  ["Resistente al agua 100 m", true],
  ["Resistencia al agua: 10 ATM", true],
  ["A prueba de agua", true],
  ["Correa impermeable", true],
  ["Water resistant to 100 m", true],
  ["Waterproof", true],
];
const MUST_PASS = [
  "Ensamblado y personalizado a mano en Miami con componentes importados",
  "Un diseño divertido y diverso para el agua de Yemayá",
  "Resistente, en acero 316L",
  "Joya de autor en los colores de Oshún",
];
// The globs must cover the files they name (and nothing outside them).
const GLOB_IN = [
  "app/creador-de-relojes/page.tsx",
  "app/creador-de-relojes/reloj.css",
  "components/watch/WatchCreator.tsx",
  "components/watch/steps/StepTapa.tsx",
  "components/diseno/WatchSheet.tsx",
  "components/home/RelojesCreador.tsx",
];
const GLOB_OUT = ["components/home/MonedasIfa.tsx", "app/configurador/page.tsx", "components/diseno/Other.tsx"];
const selfTest = [
  ...GLOB_IN.filter((f) => !inWatchGlob(f)).map((f) => `el alcance del reloj no cubre: "${f}"`),
  ...GLOB_OUT.filter((f) => inWatchGlob(f)).map((f) => `el alcance del reloj cubre de más: "${f}"`),
  ...MUST_TRIP.filter(([line, isWatch]) => scanLine(line, isWatch).length === 0).map(([line]) => `no detecta: "${line}"`),
  ...MUST_PASS.filter((line) => scanLine(line, true).length > 0).map((line) => `falso positivo: "${line}"`),
];
if (selfTest.length > 0) {
  console.error("\ncheck-copy: falla la autoprueba\n");
  for (const p of selfTest) console.error("  " + p);
  process.exit(1);
}

/** Walk a directory for text files. Hand-rolled: fs.globSync needs Node 22. */
function walk(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(full));
    else if (TEXT_EXT.test(entry.name)) found.push(full);
  }
  return found;
}

const files = [
  ...ROOTS.flatMap((r) => walk(r)),
  ...EXTRA_FILES.filter((f) => {
    try {
      return statSync(f).isFile();
    } catch {
      return false;
    }
  }),
];
if (files.length === 0) {
  console.error("check-copy: no encontré archivos bajo app/, components/ ni lib/ — ¿cambió la estructura?");
  process.exit(1);
}

const problems = [];
let watchFiles = 0;
const globHits = new Set();
for (const file of files) {
  const rel = relative(process.cwd(), file);
  for (const [g, re] of watchGlobRes) if (re.test(toPosix(rel))) globHits.add(g);
  const isWatch = WATCH_PATH.test(rel) || inWatchGlob(rel);
  if (isWatch) watchFiles += 1;
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      for (const p of scanLine(line, isWatch)) problems.push(`${rel}:${i + 1} — ${p}`);
    });
}

if (problems.length > 0) {
  console.error("\ncheck-copy: copy prohibido\n");
  for (const p of problems) console.error("  " + p);
  console.error(
    "\nEl reloj se vende como herencia e identidad: sin marcas ni modelos ajenos, sin resultados espirituales, sin afirmaciones de origen o especificación sin certificar.\n",
  );
  process.exit(1);
}
const missing = WATCH_GLOBS.filter((g) => !globHits.has(g));
console.log(
  `check-copy: autoprueba OK (${MUST_TRIP.length} + ${MUST_PASS.length}); ${files.length} archivo(s) sin marcas ajenas; ${watchFiles} archivo(s) del reloj sin palabras de resultado ni afirmaciones` +
    (missing.length ? ` (aún sin archivos: ${missing.join(", ")})` : ""),
);
